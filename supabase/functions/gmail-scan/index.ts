import { createClient } from 'npm:@supabase/supabase-js@2'
import { classifyEmail, KNOWN, type Extracted } from '../../classify.ts'

// ---------- What to look at ----------
const RECENT = 'newer_than:2y'
const SEARCHES = [
    // Anything that looks like an account, bill, statement, membership or prescription
    {
        q: `${RECENT} (statement OR bill OR invoice OR "amount due" OR "payment due" OR subscription OR ` +
            `membership OR renewal OR renews OR premium OR policy OR "account ending" OR "ending in" OR "account #" OR ` +
            `rent OR lease OR mortgage OR pharmacy OR prescription OR refill OR gym OR yoga OR fitness)`,
        max: 150,
    },
    // Companies we already recognize (finds accounts even when the only emails are marketing)
    ...chunk(Object.keys(KNOWN), 12).map((domains) => ({
        q: `${RECENT} from:(${domains.join(' OR ')})`,
        max: 50,
    })),
    // Recent personal emails, to find people the user is in touch with
    { q: 'newer_than:6m category:primary', max: 30 },
]
const MAX_BODY_CHARS = 6000   // enough to find account numbers without processing huge newsletters

Deno.serve(async (req) => {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // 1. Who's asking?
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user } } = await admin.auth.getUser(jwt)
    if (!user) return json({ ok: false, reason: 'error' }, 401)

    // 2. Their saved Gmail connection
    const { data: conn } = await admin
        .from('email_connections').select('refresh_token, email').eq('user_id', user.id).maybeSingle()
    if (!conn) return json({ ok: false, reason: 'not_connected' })

    // 3. Refresh token -> short-lived access token
    const access = await getAccessToken(conn.refresh_token)
    if (!access) {
        await admin.from('email_connections').delete().eq('user_id', user.id)
        return json({ ok: false, reason: 'reconnect' })
    }
    const gmail = (path: string) =>
        fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { headers: { Authorization: `Bearer ${access}` } })

    try {
        // 4. Collect message IDs from every search (no duplicates)
        const ids = new Set<string>()
        for (const s of SEARCHES) {
            const res = await gmail(`messages?maxResults=${s.max}&q=${encodeURIComponent(s.q)}`)
            if (!res.ok) throw new Error(`search failed: ${res.status}`)
            const body = await res.json()
            for (const m of body.messages ?? []) ids.add(m.id)
        }

        // 5. Read each email, classify it, and pull out the details. Only the results are kept.
        type Found = { result: Extracted; fromEmail: string; count: number; last: number; detailsFrom: number }
        const found = new Map<string, Found>()

        for (const batch of chunk([...ids], 10)) {
            const messages = await Promise.all(batch.map(async (id) => {
                const res = await gmail(`messages/${id}?format=full`)
                return res.ok ? await res.json() : null
            }))

            for (const msg of messages) {
                if (!msg) continue
                const headers = msg.payload?.headers ?? []
                const header = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name)?.value ?? ''
                const from = header('from')
                const fromEmail = (from.match(/[\w.+-]+@[\w.-]+/)?.[0] ?? '').toLowerCase()
                const fromName = from.split('<')[0].replace(/"/g, '').trim()
                const when = Number(msg.internalDate ?? 0)

                const result = classifyEmail({
                    subject: header('subject'),
                    body: (getBodyText(msg.payload) || msg.snippet || '').slice(0, MAX_BODY_CHARS),
                    fromName,
                    fromEmail,
                    date: new Date(when).toISOString(),
                    labels: msg.labelIds ?? [],                      // which Gmail tab (Primary, Promotions...)
                    listUnsubscribe: !!header('list-unsubscribe'),   // mass email has this header
                    precedence: header('precedence'),
                    userEmail: conn.email,                           // skip emails they sent themselves
                })
                if (!result) continue   // shipping notices, ads, etc.

                // Group the same account together: same category + company + last 4
                const key = result.category === 'personal'
                    ? `personal|${fromEmail}`
                    : `${result.category}|${result.organization.toLowerCase()}|${result.accountLast4 ?? ''}`

                const entry = found.get(key)
                if (!entry) {
                    found.set(key, { result, fromEmail, count: 1, last: when, detailsFrom: when })
                } else {
                    entry.count++
                    entry.last = Math.max(entry.last, when)
                    if (when > entry.detailsFrom) {        // keep details from the newest email
                        entry.result = { ...result, accountLast4: result.accountLast4 ?? entry.result.accountLast4 }
                        entry.detailsFrom = when
                    }
                }
            }
        }

        // 6. Merge "Venmo" (no account number) into "Venmo ending 7495" when it's the only Venmo account found,
        //    so one company doesn't show up as several cards
        for (const [key, f] of [...found.entries()]) {
            if (f.result.accountLast4 || f.result.category === 'personal') continue
            const siblings = [...found.entries()].filter(([k, g]) =>
                k !== key && k.startsWith(key) && g.result.accountLast4)   // same category + company, with a number
            if (siblings.length === 1) {
                const [, target] = siblings[0]
                target.count += f.count
                target.last = Math.max(target.last, f.last)
                found.delete(key)
            }
        }

        // 7. Save: one row per account (or per person)
        const rows = [...found.entries()].map(([key, f]) => ({
            user_id: user.id,
            finding_key: key,
            name: f.result.organization,
            category: f.result.category,
            account_last4: f.result.accountLast4,
            details: f.result.details,
            sender_domain: f.fromEmail.split('@')[1] ?? null,
            email_count: f.count,
            last_seen: f.last ? new Date(f.last).toISOString() : null,
            // no "status" here, so anything the user hid stays hidden
        }))
        if (rows.length) {
            const { error } = await admin.from('email_findings').upsert(rows, { onConflict: 'user_id,finding_key' })
            if (error) throw error
        }
        await admin.from('email_connections').update({ last_scanned_at: new Date().toISOString() }).eq('user_id', user.id)

        const { data: findings } = await admin
            .from('email_findings')
            .select('id, name, category, account_last4, details, email_count, last_seen, status')
            .eq('user_id', user.id)
            .neq('status', 'dismissed')
            .order('last_seen', { ascending: false })

        return json({ ok: true, findings: findings ?? [] })
    } catch (e) {
        console.error('gmail-scan failed:', e)
        return json({ ok: false, reason: 'error' })
    }
})

// ---------- Helpers ----------

// Gmail sends email bodies in pieces ("parts"), base64-encoded. Prefer plain text; fall back to HTML with tags removed.
function getBodyText(payload: any): string {
    let plain = ''
    let html = ''
    const walk = (part: any) => {
        if (!part) return
        const data = part.body?.data
        if (data && part.mimeType === 'text/plain' && !plain) plain = decode(data)
        if (data && part.mimeType === 'text/html' && !html) html = decode(data)
        for (const child of part.parts ?? []) walk(child)
    }
    walk(payload)
    if (plain) return plain
    return html
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/tr>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#36;/g, '$')
        .replace(/[ \t]+/g, ' ')
}

function decode(base64url: string): string {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
}

async function getAccessToken(refreshToken: string): Promise<string | null> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    })
    if (!res.ok) return null
    return (await res.json()).access_token ?? null
}

function chunk<T>(list: T[], size: number): T[][] {
    const out: T[][] = []
    for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
    return out
}

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}