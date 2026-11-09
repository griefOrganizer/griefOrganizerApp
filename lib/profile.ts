import { supabase } from './supabase'

export type Situation = 'loss' | 'preparing'

// Helpers for profile page formatting and validation

export async function getSituation(): Promise<Situation | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
        .from('profiles')
        .select('situation')
        .eq('id', user.id)
        .maybeSingle()
    return (data?.situation as Situation) ?? null
}

export async function saveSituation(situation: Situation) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not signed in')
    // upsert only updates the columns listed here, so name/phone/birthday are left unchanged/let alone
    const { error } = await supabase.from('profiles').upsert({ id: user.id, situation })
    if (error) throw error
}

// where a user already signed in should land
export async function homeRoute() {
    const situation = await getSituation()
    return situation ? '/tasks' : '/accountType'
}

export type Profile = {
    firstName: string | null
    lastName: string | null
    phone: string | null
    dateOfBirth: string | null   // 'YYYY-MM-DD'
    county: string | null
    state: string | null
    secondaryEmail: string | null
    email: string | null         // the sign-in email
    memberSince: string          // when the account was created
}

export type Connection = { id: string; name: string; relationship: string }

export async function getMyProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, date_of_birth, county, state, secondary_email')
        .eq('id', user.id)
        .maybeSingle()
    if (error) throw error
    return {
        firstName: data?.first_name ?? null,
        lastName: data?.last_name ?? null,
        phone: data?.phone ?? null,
        dateOfBirth: data?.date_of_birth ?? null,
        county: data?.county ?? null,
        state: data?.state ?? null,
        secondaryEmail: data?.secondary_email ?? null,
        email: user.email ?? null,
        memberSince: user.created_at,
    }
}

export async function getConnections(): Promise<Connection[]> {
    const { data, error } = await supabase
        .from('connections')
        .select('id, name, relationship')
        .order('created_at')
    if (error) throw error
    return data ?? []
}

export type ProfileColumn =
    'first_name' | 'last_name' | 'phone' | 'date_of_birth' | 'county' | 'state' | 'secondary_email'

// saves one field
// upsert only changes the column being passed (everything else stays the same/nothing else changes)
export async function updateProfileField(column: ProfileColumn, value: string | null) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not signed in')
    const { error } = await supabase.from('profiles').upsert({ id: user.id, [column]: value })
    if (error) throw error
}

// save function but takes multiple fields
export async function updateProfileFields(values: Partial<Record<ProfileColumn, string | null>>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not signed in')
    const { error } = await supabase.from('profiles').upsert({ id: user.id, ...values })
    if (error) throw error
}