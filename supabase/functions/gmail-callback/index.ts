import { createClient } from 'npm:@supabase/supabase-js@2'

const TEN_MINUTES = 10 * 60 * 1000

Deno.serve(async (req) => {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const googleError = url.searchParams.get('error')     // e.g. "access_denied" if they tapped Cancel

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // 1. Find (and use up) the one-time code from the start function
    if (!state) return text('Missing information. Please try connecting again from the app.')
    const { data: saved } = await admin
        .from('oauth_states')
        .delete()                                  // delete, so the same code can't be reused
        .eq('state', state)
        .select('user_id, return_url, created_at')
        .maybeSingle()
    if (!saved) return text('This link has expired. Please try connecting again from the app.')

    // Sends the user back into the app with a short status message
    const backToApp = (status: string) => {
        const sep = saved.return_url.includes('?') ? '&' : '?'
        return new Response(null, { status: 302, headers: { Location: `${saved.return_url}${sep}status=${status}` } })
    }

    if (Date.now() - new Date(saved.created_at).getTime() > TEN_MINUTES) return backToApp('expired')
    if (googleError || !code) return backToApp(googleError === 'access_denied' ? 'cancelled' : 'error')

    // 2. Trade Google's short code for real tokens. This needs the client SECRET, which is why it happens here.
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
            redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/gmail-callback`,
            grant_type: 'authorization_code',
        }),
    })
    const tokens = await tokenRes.json()
    if (!tokenRes.ok || !tokens.refresh_token) return backToApp('error')

    // 3. Google lets people uncheck individual permissions. Make sure Gmail was actually allowed.
    if (!String(tokens.scope ?? '').includes('gmail.readonly')) return backToApp('missing_permission')

    // 4. Find out which inbox this is
    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const profile = await profileRes.json()
    if (!profileRes.ok || !profile.emailAddress) return backToApp('error')

    // 5. Save the connection
    const { error } = await admin.from('email_connections').upsert({
        user_id: saved.user_id,
        provider: 'google',
        email: profile.emailAddress,
        refresh_token: tokens.refresh_token,
        scopes: tokens.scope,
        connected_at: new Date().toISOString(),
    })
    return backToApp(error ? 'error' : 'success')
})

function text(message: string) {
    return new Response(message, { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}