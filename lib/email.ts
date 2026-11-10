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

export type FindingCategory =
    'bank' | 'credit_card' | 'investment' | 'retirement' | 'insurance' | 'housing' |
    'utility' | 'phone_internet' | 'subscription' | 'membership' | 'online_account' |
    'health' | 'other_bill' | 'personal'

export type Finding = {
    id: string
    name: string
    category: FindingCategory
    account_last4: string | null
    details: {
        type?: string
        amountDue?: number
        balance?: number
        premium?: number
        charge?: number
        dueDate?: string
        renewalDate?: string
    }
    email_count: number
    last_seen: string | null
    status: 'new' | 'kept' | 'dismissed'
}

export type ScanResult =
    | { ok: true; findings: Finding[] }
    | { ok: false; reason: 'not_connected' | 'reconnect' | 'error' }

// Runs a fresh scan on the server
export async function scanGmail(): Promise<ScanResult> {
    const { data, error } = await supabase.functions.invoke('gmail-scan')
    if (error || !data) return { ok: false, reason: 'error' }
    return data as ScanResult
}

// Results from the last scan (no Gmail call, so it's instant)
export async function getFindings(): Promise<Finding[]> {
    const { data, error } = await supabase
        .from('email_findings')
        .select('id, name, category, account_last4, details, email_count, last_seen, status')
        .neq('status', 'dismissed')
        .order('last_seen', { ascending: false })
    if (error) throw error
    return (data ?? []) as Finding[]
}

export async function dismissFinding(id: string) {
    const { error } = await supabase.from('email_findings').update({ status: 'dismissed' }).eq('id', id)
    if (error) throw error
}