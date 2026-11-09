import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user } } = await admin.auth.getUser(jwt)
    if (!user) return new Response('Not signed in', { status: 401 })

    const { data: conn } = await admin
        .from('email_connections').select('refresh_token').eq('user_id', user.id).maybeSingle()

    // Tell Google to cancel the permission, not just forget it on our side
    if (conn?.refresh_token) {
        await fetch('https://oauth2.googleapis.com/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ token: conn.refresh_token }),
        })
    }
    await admin.from('email_connections').delete().eq('user_id', user.id)

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
})