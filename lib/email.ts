import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from './supabase'

// supabase.functions.invoke attaches the signed in user's login token
    // the login token is how gmail-auth-url knows who's asking specifically
// openAuthSessionAsync opens *secure* system browser instead of a loose web view inside the app
// this is why we never see the password because google also blocks signins inside app web views

export type ConnectResult = 'success' | 'cancelled' | 'missing_permission' | 'expired' | 'error'
export type EmailConnection = { provider: string; email: string; connected_at: string }

export async function connectGmail(): Promise<ConnectResult> {
    // Where Google's reply should land: grieforganizer://connectEmail in the real app,
    // or an exp://… address while testing in Expo Go. createURL picks the right one.
    const returnUrl = Linking.createURL('connectEmail')

    // 1. Ask our server for Google's permission page
    const { data, error } = await supabase.functions.invoke('gmail-auth-url', { body: { returnUrl } })
    if (error || !data?.url) return 'error'

    // 2. Open it. This waits until the browser is sent back to returnUrl (or the user closes it).
    const result = await WebBrowser.openAuthSessionAsync(data.url, returnUrl)
    if (result.type !== 'success') return 'cancelled'

    // 3. Read the status our callback added to the URL
    const { queryParams } = Linking.parse(result.url)
    return (queryParams?.status as ConnectResult) ?? 'error'
}

export async function getEmailConnection(): Promise<EmailConnection | null> {
    const { data, error } = await supabase
        .from('email_connections')
        .select('provider, email, connected_at')    // never select '*', since the token column is off-limits
        .maybeSingle()
    if (error) throw error
    return data
}

export async function disconnectEmail() {
    const { error } = await supabase.functions.invoke('gmail-disconnect')
    if (error) throw error
}