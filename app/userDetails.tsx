import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { User } from 'lucide-react-native'
import { colors, fonts, radius, space, type, surfaces, layout } from '../constants/theme'
import { supabase } from '../lib/supabase'
import { getConnections, getMyProfile, type Connection, type Profile } from '../lib/profile'
import { DetailCard } from '../components/DetailCard'

type Tab = 'connections' | 'details'

// Avatar colors, cycled through for each connection (background, icon)
const AVATAR_COLORS = [
    { bg: '#CBC6DC', fg: '#6E5BA8' },   // purple
    { bg: '#DDC9C9', fg: '#A85F5F' },   // rose
    { bg: '#C9D8CC', fg: '#5E9B63' },   // green
    { bg: '#E3D6C3', fg: '#9A7440' },   // sand
]

// Helpers
function fromISODate(s: string) {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
}

function ageFrom(dob: Date) {
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const hadBirthday =
        today.getMonth() > dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())
    if (!hadBirthday) age--
    return age
}
function formatPhone(d: string) {
    return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : d
}

// Small pieces
function Avatar({ bg, fg, size = 72 }: { bg: string; fg: string; size?: number }) {
    return (
        <View style={[styles.avatar, { backgroundColor: bg, width: size, height: size }]}>
            <User size={size * 0.55} color={fg} strokeWidth={2} />
        </View>
    )
}

// ---------- Screen ----------
export default function ProfileScreen() {
    const router = useRouter()
    const [tab, setTab] = useState<Tab>('connections')
    const [profile, setProfile] = useState<Profile | null>(null)
    const [connections, setConnections] = useState<Connection[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // reload whenever the screen comes into view
    // (like after editing details)
    useFocusEffect(
        useCallback(() => {
            let active = true
            Promise.all([getMyProfile(), getConnections()])
                .then(([p, c]) => { if (active) { setProfile(p); setConnections(c); setError('') } })
                .catch(() => { if (active) setError('We couldn\'t load your profile. Please try again.') })
                .finally(() => { if (active) setLoading(false) })
            return () => { active = false }
        }, [])
    )

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
                            Family and friends you invite to help share the load will show up here.
                        </Text>
                    )
                )}

                {!loading && tab === 'details' && (
                    <>
                        <DetailCard
                            label="Birthday"
                            value={dob ? dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null}
                            sub={dob ? `Age: ${ageFrom(dob)}` : null}
                        />
                        <DetailCard
                            label="County of residence"
                            value={profile?.county ?? null}
                            sub={profile?.state ? `State: ${profile.state}` : null}
                        />
                        <DetailCard label="Phone number" value={profile?.phone ? formatPhone(profile.phone) : null} />
                        <DetailCard label="Primary email" value={profile?.email ?? null} />
                        <DetailCard label="Secondary email" value={profile?.secondaryEmail ?? null} />

                        <Pressable
                            onPress={() => router.push('/userDetails')}
                            style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
                            accessibilityRole="button"
                        >
                            <Text style={styles.buttonText}>Edit details</Text>
                        </Pressable>

                        <Pressable onPress={signOut} style={styles.textButton} accessibilityRole="button">
                            <Text style={styles.textButtonLabel}>Sign out</Text>
                        </Pressable>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: layout.screen,
    header: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.lg },
    intro: { gap: space.sm },

    userRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    userText: { flex: 1, gap: space.xxs },
    userName: type.heading,
    userSince: type.cardSubtitle,
    avatar: { borderRadius: radius.avatar, alignItems: 'center', justifyContent: 'center' },

    tabs: { flexDirection: 'row', justifyContent: 'center', gap: space.xl },
    tab: { ...surfaces.textButton, paddingHorizontal: space.sm },
    tabText: { ...type.label, fontFamily: fonts.medium, color: colors.textMuted },
    tabTextSelected: { fontFamily: fonts.semibold, color: colors.text, textDecorationLine: 'underline' },

    content: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xl, gap: space.md },
    card: surfaces.card,
    connectionCard: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
    connectionName: type.cardTitle,
    connectionRelation: type.cardSubtitle,

    button: { ...surfaces.button, marginTop: space.sm },
    buttonText: type.button,
    textButton: surfaces.textButton,
    textButtonLabel: type.link,
})