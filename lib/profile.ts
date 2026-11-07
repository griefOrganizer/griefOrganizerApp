import { supabase } from './supabase'

export type Situation = 'loss' | 'preparing'

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
    return situation ? '/tasks' : '/userDetails'
}