import { useCallback, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useLocalSearchParams } from 'expo-router'
import { User } from 'lucide-react-native'
import { colors, radius, space, type } from '../constants/theme'
import { supabase } from '../lib/supabase'
import { BackArrow } from '../components/BackArrow'
import { DetailGroup, DetailRow } from '../components/DetailGroup'
import { formatPhone, fromISODate } from '../lib/validation'

// One row from the get_connection_profile() database function (see connection_profile.sql)
type ConnectionProfile = {
    id: string
    first_name: string | null
    last_name: string | null
    is_deceased: boolean
    can_see_details: boolean      // false = only the name is shared with you
    date_of_birth: string | null
    phone: string | null
    email: string | null
    secondary_email: string | null
    county: string | null
    state: string | null
}

// ---------- Formatting helpers ----------
function ageFrom(dob: Date) {
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const hadBirthday =
        today.getMonth() > dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())
    if (!hadBirthday) age--
    return age
}

// ---------- Screen ----------
export default function FriendProfile() {
    const { userId } = useLocalSearchParams<{ userId: string }>()
    const [person, setPerson] = useState<ConnectionProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Reload whenever the screen comes into view
    useFocusEffect(
        useCallback(() => {
            let active = true
            supabase
                .rpc('get_connection_profile', { target: userId })
                .maybeSingle()
                .then(({ data, error: loadError }) => {
                    if (!active) return
                    if (loadError) console.warn('get_connection_profile failed:', loadError)
                    else if (!data) setError('We couldn\'t find this profile.')
                    else { setPerson(data as ConnectionProfile); setError('') }
                    setLoading(false)
                })
            return () => { active = false }
        }, [userId])
    )

    const fullName = person
        ? [person.first_name, person.last_name].filter(Boolean).join(' ') || 'Name not available'
        : ''
    const dob = person?.date_of_birth ? fromISODate(person.date_of_birth) : null

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>

            {/* ---------- Fixed header ---------- */}
            <View style={styles.header}>
                <BackArrow />
                <Text style={styles.title}>Connection Profile</Text>

                {person && (
                    <View style={styles.userRow}>
                        <View style={styles.avatar}>
                            <User size={84 * 0.55} color={colors.primaryDark} strokeWidth={2} />
                        </View>
                        <View style={styles.userText}>
                            <Text style={styles.userName}>{fullName}</Text>
                            {person.is_deceased ? <Text style={styles.userSub}>Deceased</Text> : null}
                        </View>
                    </View>
                )}
            </View>

            {/* ---------- Scrolling content ---------- */}
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {loading && <ActivityIndicator color={colors.primaryDark} />}
                {!loading && error ? <Text style={type.body}>{error}</Text> : null}

                {!loading && person && !person.can_see_details && (
                    <Text style={type.body}>
                        {fullName}'s details are private. They'll show here once {fullName} connects with you too.
                    </Text>
                )}

                {!loading && person?.can_see_details && (
                    <>
                        <DetailGroup title="About them">
                            <DetailRow label="First name" value={person.first_name} />
                            <DetailRow label="Last name" value={person.last_name} />
                            <DetailRow
                                label="Birthday"
                                value={dob ? `${dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}${person.is_deceased ? '' : ` · Age ${ageFrom(dob)}`}` : null}
                                last
                            />
                        </DetailGroup>

                        <DetailGroup title="Contact">
                            <DetailRow label="Phone number" value={person.phone ? formatPhone(person.phone) : null} />
                            <DetailRow label="Primary email" value={person.email} />
                            <DetailRow label="Secondary email" value={person.secondary_email} last />
                        </DetailGroup>

                        <DetailGroup title="Where they live">
                            <DetailRow label="County" value={person.county} />
                            <DetailRow label="State" value={person.state} last />
                        </DetailGroup>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    // same header styling as the profile tab
    header: { paddingHorizontal: space.lg, gap: space.lg, paddingBottom: space.md },
    title: { ...type.title, fontSize: 30, lineHeight: 36 },

    userRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    userText: { flex: 1, gap: 4 },
    userName: type.heading,
    userSub: { ...type.body, color: colors.textMuted, fontSize: 16 },
    avatar: {
        width: 84, height: 84, borderRadius: radius.avatar,
        backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
    },

    content: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xl, gap: space.lg },
})