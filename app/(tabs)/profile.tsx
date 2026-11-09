import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { User } from 'lucide-react-native'
import { colors, fonts, radius, space, type, surfaces } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import { getConnections, getMyProfile, type Connection, type Profile } from '../../lib/profile'
import { DetailGroup, DetailRow } from '../../components/DetailGroup'
import { EditDetailModal, type EditableField } from '../../components/EditDetailModal'
import { formatPhone, fromISODate } from '../../lib/validation'

type Tab = 'connections' | 'details'

// Avatar colors, cycled through for each connection (background, icon)
const AVATAR_COLORS = [
    { bg: '#CBC6DC', fg: '#6E5BA8' },   // purple
    { bg: '#DDC9C9', fg: '#A85F5F' },   // rose
    { bg: '#C9D8CC', fg: '#5E9B63' },   // green
    { bg: '#E3D6C3', fg: '#9A7440' },   // sand
]

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

// ---------- Small pieces ----------
function Avatar({ bg, fg, size = 72 }: { bg: string; fg: string; size?: number }) {
    return (
        <View style={[styles.avatar, { backgroundColor: bg, width: size, height: size }]}>
            <User size={size * 0.55} color={fg} strokeWidth={2} />
        </View>
    )
}

function DetailCard({ label, value, sub }: { label: string; value: string | null; sub?: string | null }) {
    return (
        <View style={styles.card}>
            <Text style={styles.detailLine}>
                {label}:{' '}
                {value
                    ? <Text style={styles.detailValue}>{value}</Text>
                    : <Text style={styles.detailMissing}>Not added</Text>}
            </Text>
            {sub ? <Text style={styles.detailSub}>{sub}</Text> : null}
        </View>
    )
}

// ---------- Screen ----------
export default function ProfileScreen() {
    const router = useRouter()
    const [editing, setEditing] = useState<EditableField | null>(null)
    const [tab, setTab] = useState<Tab>('connections')
    const [profile, setProfile] = useState<Profile | null>(null)
    const [connections, setConnections] = useState<Connection[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Reload whenever the screen comes into view (e.g. after editing details)
    const load = useCallback(async () => {
        try {
            const [p, c] = await Promise.all([getMyProfile(), getConnections()])
            setProfile(p)
            setConnections(c)
            setError('')
        } catch {
            setError('We couldn\'t load your profile. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [])

    useFocusEffect(useCallback(() => { load() }, [load]))

    const open = (column: EditableField['column'], label: string, kind: EditableField['kind'], value: string | null) =>
        () => setEditing({ column, label, kind, value })

    const fullName =
        [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
        profile?.email?.split('@')[0] ||
        'Your name'
    const memberSince = profile
        ? new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : ''
    const dob = profile?.dateOfBirth ? fromISODate(profile.dateOfBirth) : null

    async function signOut() {
        await supabase.auth.signOut()
        router.replace('/signin')
    }

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>

            {/* ---------- Fixed header ---------- */}
            <View style={styles.header}>
                <View style={styles.intro}>
                    <Text style={type.title}>Your Profile</Text>
                    <Text style={type.body}>We're here to help you find the next step</Text>
                </View>

                <View style={styles.userRow}>
                    <Avatar bg="#B5C6E0" fg={colors.primaryDark} size={84} />
                    <View style={styles.userText}>
                        <Text style={styles.userName}>{fullName}</Text>
                        {memberSince ? <Text style={styles.userSince}>User since {memberSince}</Text> : null}
                    </View>
                </View>

                <View style={styles.tabs} accessibilityRole="tablist">
                    {(['connections', 'details'] as Tab[]).map((t) => {
                        const selected = tab === t
                        return (
                            <Pressable
                                key={t}
                                onPress={() => setTab(t)}
                                style={styles.tab}
                                accessibilityRole="tab"
                                accessibilityState={{ selected }}
                            >
                                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                                    {t === 'connections' ? 'Connections' : 'Details'}
                                </Text>
                            </Pressable>
                        )
                    })}
                </View>
            </View>

            {/* ---------- Scrolling content ---------- */}
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {error ? <Text style={type.body}>{error}</Text> : null}
                {loading && <Text style={type.body}>Loading...</Text>}

                {!loading && tab === 'connections' && (
                    connections.length > 0 ? (
                        connections.map((c, i) => {
                            const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
                            return (
                                <View key={c.id} style={[styles.card, styles.connectionCard]}>
                                    <Avatar bg={color.bg} fg={color.fg} />
                                    <View style={styles.userText}>
                                        <Text style={styles.connectionName}>{c.name}</Text>
                                        <Text style={styles.connectionRelation}>{c.relationship}</Text>
                                    </View>
                                </View>
                            )
                        })
                    ) : (
                        <Text style={type.body}>
                            Family and friends you invite to help will show up here.
                        </Text>
                    )
                )}

                {!loading && tab === 'details' && profile && (
                    <>
                        <DetailGroup title="About you">
                            <DetailRow label="First name" value={profile.firstName}
                                onPress={open('first_name', 'First name', 'name', profile.firstName)} />
                            <DetailRow label="Last name" value={profile.lastName}
                                onPress={open('last_name', 'Last name', 'name', profile.lastName)} />
                            <DetailRow
                                label="Birthday"
                                value={dob ? `${dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · Age ${ageFrom(dob)}` : null}
                                onPress={open('date_of_birth', 'Birthday', 'date', profile.dateOfBirth)}
                                last
                            />
                        </DetailGroup>

                        <DetailGroup title="Contact">
                            <DetailRow label="Phone number" value={profile.phone ? formatPhone(profile.phone) : null}
                                onPress={open('phone', 'Phone number', 'phone', profile.phone)} />
                            <DetailRow label="Primary email" value={profile.email} />
                            <DetailRow label="Secondary email" value={profile.secondaryEmail}
                                onPress={open('secondary_email', 'Secondary email', 'email', profile.secondaryEmail)} last />
                        </DetailGroup>

                        <DetailGroup title="Where you live">
                            <DetailRow label="County" value={profile.county}
                                onPress={open('county', 'County', 'place', profile.county)} />
                            <DetailRow label="State" value={profile.state}
                                onPress={open('state', 'State', 'place', profile.state)} last />
                        </DetailGroup>

                        <Pressable onPress={signOut} style={styles.textButton} accessibilityRole="button">
                            <Text style={styles.textButtonLabel}>Sign out</Text>
                        </Pressable>
                    </>
                )}
            </ScrollView>
          <EditDetailModal field={editing} onClose={() => setEditing(null)} onSaved={load} />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.lg },
    intro: { gap: space.sm },

    userRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    userText: { flex: 1, gap: 4 },
    userName: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
    userSince: { ...type.body, color: colors.text },
    avatar: { borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

    tabs: { flexDirection: 'row', justifyContent: 'center', gap: space.xl },
    tab: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.sm },
    tabText: { fontFamily: fonts.medium, fontSize: 17, color: colors.textMuted },
    tabTextSelected: { fontFamily: fonts.semibold, color: colors.text, textDecorationLine: 'underline' },

    content: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xl, gap: space.lg },
    card: { ...surfaces.card },
    connectionCard: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
    connectionName: { fontFamily: fonts.semibold, fontSize: 19, color: colors.text },
    connectionRelation: { ...type.body, color: colors.text },

    detailLine: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 26, color: colors.text },
    detailValue: { color: colors.primaryDark },
    detailMissing: { fontFamily: fonts.regular, color: colors.textMuted },
    detailSub: { ...type.body, color: colors.text, marginTop: 4 },

    textButton: { height: 44, alignItems: 'center', justifyContent: 'center' },
    textButtonLabel: { fontFamily: fonts.medium, fontSize: 16, color: colors.primary },
})