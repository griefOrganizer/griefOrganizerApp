import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { User } from 'lucide-react-native'
import { colors, fonts, radius, space, type, surfaces } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import { getMyProfile, type Profile } from '../../lib/profile'
import { DetailGroup, DetailRow } from '../../components/DetailGroup'
import { EditDetailModal, type EditableField } from '../../components/EditDetailModal'
import { formatPhone, fromISODate } from '../../lib/validation'
import { AddressModal } from '../../components/AddressModal'
import { TextBox } from '../../components/TextBox'
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown'

type Tab = 'connections' | 'details'

// One row from the my_connections() database function
type Connection = {
    id: string
    relationship: string
    connected_id: string
    first_name: string | null
    last_name: string | null
    is_deceased: boolean
}

// One row from the search_profiles() database function
type SearchResult = {
    id: string
    first_name: string | null
    last_name: string | null
    is_deceased: boolean
}

const nameOf = (p: { first_name: string | null; last_name: string | null }) =>
    [p.first_name, p.last_name].filter(Boolean).join(' ')

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
    const [tab, setTab] = useState<Tab>('details')
    const [profile, setProfile] = useState<Profile | null>(null)
    const [connections, setConnections] = useState<Connection[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [addressOpen, setAddressOpen] = useState(false)

    // Name search (shown when there are no connections yet)
    const [results, setResults] = useState<SearchResult[]>([])
    const [searching, setSearching] = useState(false)
    const [picked, setPicked] = useState<SearchResult | null>(null)    // person chosen from the list
    const [relationship, setRelationship] = useState('')
    const [connectError, setConnectError] = useState('')
    const [adding, setAdding] = useState(false)

    // Reload whenever the screen comes into view (e.g. after editing details)
    const load = useCallback(async () => {
        try {
            // my_connections() returns names even for profiles you don't manage (see connection_search.sql)
            const [p, { data, error: connectionsError }] = await Promise.all([
                getMyProfile(),
                supabase.rpc('my_connections'),
            ])
            if (connectionsError) throw connectionsError

            setProfile(p)
            setConnections((data ?? []) as Connection[])
            setError('')
        } catch {
            setError('We couldn\'t load your profile. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [])

    async function searchPeople(text: string) {
        if (text.trim().length < 2) { setResults([]); return }
        setSearching(true)
        const { data, error: searchError } = await supabase.rpc('search_profiles', { q: text })
        setResults(searchError ? [] : (data ?? []) as SearchResult[])
        setSearching(false)
    }

    async function addConnection() {
        if (!picked || adding) return
        const rel = relationship.trim()
        if (!rel) { setConnectError('Please say how you\'re connected, like "mother" or "friend".'); return }
        if (rel.length > 50) { setConnectError('Please keep this under 50 characters.'); return }

        setAdding(true)
        setConnectError('')
        const { data: { user } } = await supabase.auth.getUser()
        const { error: insertError } = user
            ? await supabase.from('profile_connections').insert({
                profile_id: user.id,
                connected_profile_id: picked.id,
                relationship: rel,
            })
            : { error: new Error('Not signed in') }
        setAdding(false)

        if (insertError) {
            setConnectError('We couldn\'t add this connection. Please try again.')
            return
        }
        setPicked(null)
        setRelationship('')
        setResults([])
        load()   // the new connection shows up in the list
    }

    useFocusEffect(useCallback(() => { load() }, [load]))

    const open = (column: EditableField['column'], label: string, kind: EditableField['kind'], value: string | null) =>
        () => setEditing({ column, label, kind, value })

    const fullName =
        [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
        profile?.email?.split('@')[0] ||
        'Your name'
    const hasName = !!(profile?.firstName || profile?.lastName)   // name entered --> show email underneath instead of "User since"
    const memberSince = profile
        ? new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : ''
    const dob = profile?.dateOfBirth ? fromISODate(profile.dateOfBirth) : null

    async function signOut() {
        await supabase.auth.signOut()
        router.replace('/signin')
    }

    async function connectEmail() {
        // await supabase.auth.signOut()
        router.replace('/connectEmail')
    }

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>

            {/* ---------- Fixed header ---------- */}
            <View style={styles.header}>
                <View style={styles.intro}>
                    <Text style={styles.title}>Your Profile</Text>
                    {/* <Text style={type.body}>We're here to help you find the next step</Text> */}
                </View>

                <View style={styles.userRow}>
                    <Avatar bg={colors.primaryMuted} fg={colors.primaryDark} size={84} />
                    <View style={styles.userText}>
                        <Text style={styles.userName}>{fullName}</Text>
                        {hasName
                            ? (profile?.email ? <Text style={styles.userSince}>{profile.email}</Text> : null)
                            : (memberSince ? <Text style={styles.userSince}>User since {memberSince}</Text> : null)}
                    </View>
                </View>

                <View style={styles.tabs} accessibilityRole="tablist">
                    {(['details', 'connections'] as Tab[]).map((t) => {
                        const selected = tab === t
                        return (
                            <Pressable
                                key={t}
                                onPress={() => setTab(t)}
                                style={[styles.tab, selected && styles.tabSelected]}
                                accessibilityRole="tab"
                                accessibilityState={{ selected }}
                            >
                                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                                    {t === 'details' ? 'Details' : 'Connections'}
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
                                onPress={() => setAddressOpen(true)} />
                            <DetailRow label="State" value={profile.state}
                                onPress={() => setAddressOpen(true)} last />
                        </DetailGroup>

                        <View style={styles.textButtons}>
                            <Pressable onPress={connectEmail} style={surfaces.textButton} accessibilityRole="button">
                                <Text style={styles.connectEmailText}>Connect Email</Text>
                            </Pressable>
                            <Pressable onPress={signOut} style={surfaces.textButton} accessibilityRole="button">
                                <Text style={styles.signOutText}>Sign out</Text>
                            </Pressable>
                        </View>
                    </>
                )}

                {!loading && tab === 'connections' && (
                    <>
                        {connections.length > 0 ? connections.map((c, i) => {
                            const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
                            return (
                                <Pressable
                                    key={c.id}
                                    style={[styles.card, styles.connectionCard]}
                                    onPress={() => router.push({ pathname: '/../friendProfile', params: { userId: c.connected_id } })}
                                    accessibilityRole="button"
                                >
                                    <Avatar bg={color.bg} fg={color.fg} />
                                    <View style={styles.userText}>
                                        <Text style={styles.connectionName}>
                                            {nameOf(c) || 'Name not available'}
                                        </Text>
                                        <Text style={styles.connectionRelation}>
                                            {c.relationship}{c.is_deceased ? ' · Deceased' : ''}
                                        </Text>
                                    </View>
                                </Pressable>
                            )
                        }) : (
                            <Text style={type.body}>
                                Family and friends you invite to help will show up here.
                            </Text>
                        )}

                        {/* ---------- Search for someone by name ---------- */}
                        <View style={styles.search}>
                            <Text style={type.section} accessibilityRole="header">Find someone by name</Text>
                            <AutocompleteDropdown
                                dataSet={results.map((r) => ({ id: r.id, title: nameOf(r) }))}
                                onChangeText={searchPeople}
                                onSelectItem={(item) => {
                                    const person = item ? results.find((r) => r.id === item.id) : null
                                    setPicked(person ?? null)
                                    setConnectError('')
                                }}
                                onClear={() => { setResults([]); setPicked(null) }}
                                loading={searching}
                                useFilter={false}           // the database already filters
                                debounce={300}
                                direction="down"
                                clearOnFocus={false}
                                closeOnBlur
                                showChevron={false}
                                emptyResultText="No one found with that name"
                                textInputProps={{
                                    placeholder: 'Type a name',
                                    autoCorrect: false,
                                    autoCapitalize: 'words',
                                    placeholderTextColor: colors.textMuted,
                                    style: styles.searchInput,
                                }}
                                inputContainerStyle={styles.searchField}
                                suggestionsListContainerStyle={styles.searchList}
                                renderItem={(item) => {
                                    const person = results.find((r) => r.id === item.id)
                                    return (
                                        <View style={styles.searchRow}>
                                            <Text style={styles.searchName}>{item.title}</Text>
                                            {person?.is_deceased ? <Text style={type.small}>Deceased</Text> : null}
                                        </View>
                                    )
                                }}
                            />

                            {/* after picking someone: ask how they're related, then save */}
                            {picked && (
                                <View style={styles.searchConfirm}>
                                    <TextBox
                                        label={`How is ${nameOf(picked)} connected to you?`}
                                        value={relationship}
                                        onChangeText={(v) => { setRelationship(v); setConnectError('') }}
                                        placeholder="Mother, friend, brother..."
                                        autoCapitalize="none"
                                        maxLength={50}
                                        returnKeyType="done"
                                        onSubmitEditing={addConnection}
                                    />
                                    {connectError ? <Text style={type.error}>{connectError}</Text> : null}
                                    <Pressable
                                        onPress={addConnection}
                                        disabled={adding}
                                        style={({ pressed }) => [surfaces.button, (pressed || adding) && { opacity: 0.8 }]}
                                        accessibilityRole="button"
                                    >
                                        <Text style={type.button}>{adding ? 'Adding…' : 'Add connection'}</Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
            <EditDetailModal field={editing} onClose={() => setEditing(null)} onSaved={load} />
            <AddressModal
                visible={addressOpen}
                currentCounty={profile?.county ?? null}
                currentState={profile?.state ?? null}
                onClose={() => setAddressOpen(false)}
                onSaved={load}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    // header matches the Tasks and Email screens so the title look doesn't change when switching tabs
    header: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.lg },
    intro: { gap: space.xxs },
    title: { ...type.title, fontSize: 30, lineHeight: 36 },

    userRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    userText: { flex: 1, gap: 4 },
    userName: type.heading,
    userSince: { ...type.body, color: colors.textMuted, fontSize: 16 }, // i didn't like how large it was, this is on purpose
    avatar: { borderRadius: radius.avatar, alignItems: 'center', justifyContent: 'center' },

    // segmented control: white track selected segment filled like the reference design
    tabs: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.button,
        padding: space.xxs,
        gap: space.xxs,
    },
    tab: {
        flex: 1,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.button - space.xxs,   // nests inside the track's corners
    },
    tabSelected: { backgroundColor: colors.primaryDark },
    tabText: { fontFamily: fonts.medium, fontSize: 17, color: colors.textMuted },
    tabTextSelected: { fontFamily: fonts.semibold, color: colors.textOnPrimary },

    content: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xl, gap: space.lg },
    card: { ...surfaces.card },
    connectionCard: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
    connectionName: { fontFamily: fonts.semibold, fontSize: 19, color: colors.text },
    connectionRelation: { ...type.body, color: colors.text },

    detailLine: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 26, color: colors.text },
    detailValue: { color: colors.primaryDark },
    detailMissing: { fontFamily: fonts.regular, color: colors.textMuted },
    detailSub: { ...type.body, color: colors.text, marginTop: 4 },

    // name search
    search: { gap: space.sm },
    searchField: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.button,
    },
    searchInput: { fontFamily: fonts.regular, fontSize: 17, color: colors.text, backgroundColor: colors.surface, borderRadius: radius.button },
    searchList: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.button },
    searchRow: { paddingVertical: space.sm, paddingHorizontal: space.md, gap: 2 },
    searchName: { ...type.label, fontFamily: fonts.medium },
    searchConfirm: { gap: space.sm, marginTop: space.xs },

    textButtons: { alignItems: 'center', gap: space.xxs, marginTop: space.sm },
    // textButtonLabel: { fontFamily: fonts.medium, fontSize: 16, color: colors.primary },
    signOutText: { fontFamily: fonts.bold, fontSize: 18, color: colors.error },
    connectEmailText: { ...type.link, fontSize: 18 },
})