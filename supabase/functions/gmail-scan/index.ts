import { createClient } from 'npm:@supabase/supabase-js@2'

type Category = 'bank' | 'credit_card' | 'investment' | 'insurance' | 'utility' | 'phone_internet' | 'subscription'

// Senders we recognize. Add more anytime: the key is the sender's website.
const KNOWN: Record<string, { name: string; category: Category }> = {
    'chase.com': { name: 'Chase', category: 'bank' },
    'bankofamerica.com': { name: 'Bank of America', category: 'bank' },
    'wellsfargo.com': { name: 'Wells Fargo', category: 'bank' },
    'citi.com': { name: 'Citi', category: 'bank' },
    'capitalone.com': { name: 'Capital One', category: 'bank' },
    'usbank.com': { name: 'U.S. Bank', category: 'bank' },
    'pnc.com': { name: 'PNC', category: 'bank' },
    'ally.com': { name: 'Ally Bank', category: 'bank' },
    'americanexpress.com': { name: 'American Express', category: 'credit_card' },
    'discover.com': { name: 'Discover', category: 'credit_card' },
    'fidelity.com': { name: 'Fidelity', category: 'investment' },
    'vanguard.com': { name: 'Vanguard', category: 'investment' },
    'schwab.com': { name: 'Charles Schwab', category: 'investment' },
    'robinhood.com': { name: 'Robinhood', category: 'investment' },
    'statefarm.com': { name: 'State Farm', category: 'insurance' },
    'geico.com': { name: 'GEICO', category: 'insurance' },
    'progressive.com': { name: 'Progressive', category: 'insurance' },
    'allstate.com': { name: 'Allstate', category: 'insurance' },
    'libertymutual.com': { name: 'Liberty Mutual', category: 'insurance' },
    'dteenergy.com': { name: 'DTE Energy', category: 'utility' },
    'consumersenergy.com': { name: 'Consumers Energy', category: 'utility' },
    'comcast.net': { name: 'Xfinity', category: 'phone_internet' },
    'xfinity.com': { name: 'Xfinity', category: 'phone_internet' },
    'att.com': { name: 'AT&T', category: 'phone_internet' },
    'verizon.com': { name: 'Verizon', category: 'phone_internet' },
    't-mobile.com': { name: 'T-Mobile', category: 'phone_internet' },
    'spectrum.com': { name: 'Spectrum', category: 'phone_internet' },
    'netflix.com': { name: 'Netflix', category: 'subscription' },
    'spotify.com': { name: 'Spotify', category: 'subscription' },
    'hulu.com': { name: 'Hulu', category: 'subscription' },
    'disneyplus.com': { name: 'Disney+', category: 'subscription' },
    'max.com': { name: 'Max', category: 'subscription' },
    'peacocktv.com': { name: 'Peacock', category: 'subscription' },
    'paramountplus.com': { name: 'Paramount+', category: 'subscription' },
    'Northfield': { name: 'Northfield Credit Union', category: 'credit_card' }, // !!! test
    'Cardinal': { name: 'Cardinal Wireless', category: 'phone_internet' }, // !!! test
    'Evergreen': { name: 'Evergreen Life Insurance', category: 'insurance' }, // !!! test

}

// Searches use the same syntax as the Gmail search bar
const RECENT = 'newer_than:2y'
const SEARCHES: { category: Category; q: string }[] = [
    { category: 'bank',         q: `subject:(statement OR "account alert" OR "direct deposit") ${RECENT}` },
    { category: 'utility',      q: `subject:("amount due" OR "payment due" OR "your bill") ${RECENT}` },
    { category: 'insurance',    q: `subject:(premium OR "policy renewal" OR "insurance policy") ${RECENT}` },
    { category: 'subscription', q: `subject:(subscription OR membership OR "renews on") ${RECENT}` },
    // Plus one search per group of known senders
    ...chunk(Object.keys(KNOWN), 12).map((domains) => ({
        category: 'bank' as Category,   // placeholder; known senders get their real category below
        q: `from:(${domains.join(' OR ')}) ${RECENT}`,
    })),
]

const PER_SEARCH = 25   // messages looked at per search, to keep scans quick

Deno.serve(async (req) => {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // 1. Who's asking?
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user } } = await admin.auth.getUser(jwt)
    if (!user) return json({ ok: false, reason: 'error' }, 401)

    // 2. Their saved Gmail connection
    const { data: conn } = await admin
        .from('email_connections').select('refresh_token').eq('user_id', user.id).maybeSingle()
    if (!conn) return json({ ok: false, reason: 'not_connected' })

    // 3. Swap the refresh token for a short-lived access token
    const access = await getAccessToken(conn.refresh_token)
    if (!access) {
        // Expired (7 days in testing mode) or revoked: clear it so the app asks them to reconnect
        await admin.from('email_connections').delete().eq('user_id', user.id)
        return json({ ok: false, reason: 'reconnect' })
    }
    const gmail = (path: string) =>
        fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { headers: { Authorization: `Bearer ${access}` } })

    try {
        // 4. Run the searches and collect message IDs (with a category hint for each)
        const hints = new Map<string, Category>()
        for (const s of SEARCHES) {
            const res = await gmail(`messages?maxResults=${PER_SEARCH}&q=${encodeURIComponent(s.q)}`)
            if (!res.ok) throw new Error(`search failed: ${res.status}`)
            const body = await res.json()
            for (const m of body.messages ?? []) if (!hints.has(m.id)) hints.set(m.id, s.category)
        }

        // 5. Read only the "From" line of each message, 10 at a time
        const found = new Map<string, { name: string; category: Category; count: number; last: number; known: boolean }>()
        const ids = [...hints.keys()]
        for (const batch of chunk(ids, 10)) {
            const results = await Promise.all(batch.map(async (id) => {
                const res = await gmail(`messages/${id}?format=metadata&metadataHeaders=From`)
                return res.ok ? { id, msg: await res.json() } : null
            }))
            for (const r of results) {
                if (!r) continue
                const from: string = r.msg.payload?.headers?.find((h: any) => h.name === 'From')?.value ?? ''
                const address = from.match(/[\w.+-]+@[\w.-]+/)?.[0]
                if (!address) continue

                const domain = baseDomain(address.split('@')[1])
                const known = KNOWN[domain]
                const displayName = from.split('<')[0].replace(/"/g, '').trim()
                const when = Number(r.msg.internalDate ?? 0)

                const entry = found.get(domain) ?? {
                    name: known?.name ?? (displayName || domain),
                    category: known?.category ?? hints.get(r.id)!,
                    count: 0,
                    last: 0,
                    known: !!known,
                }
                entry.count++
                entry.last = Math.max(entry.last, when)
                found.set(domain, entry)
            }
        }

        // 6. Keep known senders, plus unknown ones that showed up at least twice (cuts down on noise)
        const rows = [...found.entries()]
            .filter(([, f]) => f.known || f.count >= 2)
            .map(([domain, f]) => ({
                user_id: user.id,
                sender_domain: domain,
                name: f.name,
                category: f.category,
                email_count: f.count,
                last_seen: f.last ? new Date(f.last).toISOString() : null,
                // no "status" here, so a finding the user dismissed stays dismissed
            }))

        // 7. Save
        if (rows.length) {
            const { error } = await admin.from('email_findings').upsert(rows, { onConflict: 'user_id,sender_domain' })
            if (error) throw error
        }
        await admin.from('email_connections').update({ last_scanned_at: new Date().toISOString() }).eq('user_id', user.id)

        const { data: findings } = await admin
            .from('email_findings')
            .select('id, name, sender_domain, category, email_count, last_seen, status')
            .eq('user_id', user.id)
            .neq('status', 'dismissed')
            .order('email_count', { ascending: false })

        return json({ ok: true, findings: findings ?? [] })
    } catch (e) {
        console.error('gmail-scan failed:', e)
        return json({ ok: false, reason: 'error' })
    }
})

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
    const body = await res.json()
    return body.access_token ?? null
}

// "alerts.chase.com" -> "chase.com"
function baseDomain(host: string) {
    return host.toLowerCase().split('.').slice(-2).join('.')
}

function chunk<T>(list: T[], size: number): T[][] {
    const out: T[][] = []
    for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
    return out
}

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}