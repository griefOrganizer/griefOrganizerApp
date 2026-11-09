import { createClient } from 'npm:@supabase/supabase-js@2'

const SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/gmail.readonly'].join(' ')
// Only send people back into our own app (or Expo Go while developing)
const ALLOWED_RETURN_URLS = [/^grieforganizer:\/\//, /^exp:\/\//]

Deno.serve(async (req) => {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // 1. Who is asking? The app sends the signed-in user's token automatically.
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user }, error: userError } = await admin.auth.getUser(jwt)
    if (userError || !user) return json({ error: 'Not signed in' }, 401)

    // 2. Where should Google's reply eventually send them back to?
    const { returnUrl } = await req.json().catch(() => ({}))
    if (typeof returnUrl !== 'string' || !ALLOWED_RETURN_URLS.some((r) => r.test(returnUrl))) {
        return json({ error: 'Invalid return URL' }, 400)
    }

    // 3. Make and remember a one-time code linking this request to this user
    const state = crypto.randomUUID()
    const { error: saveError } = await admin.from('oauth_states').insert({ state, user_id: user.id, return_url: returnUrl })
    if (saveError) return json({ error: 'Could not start connection' }, 500)

    // 4. Build Google's permission page URL
    const params = new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/gmail-callback`,
        response_type: 'code',
        scope: SCOPES,
        access_type: 'offline',     // gives us a refresh token, so we can read email later, not just right now
        prompt: 'select_account consent',   // always ask which Google account, then show the permission screen
        include_granted_scopes: 'true',
        state,
    })
    return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` })
})

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}