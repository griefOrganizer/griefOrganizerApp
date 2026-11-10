import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import {
    CreditCard, Landmark, Repeat, Shield, TrendingUp, Wifi, Zap, type LucideIcon,
} from 'lucide-react-native'
import { colors, fonts, space, type, surfaces } from '../../constants/theme'
import { BackArrow } from '../../components/BackArrow'
import {
    dismissFinding, getEmailConnection, getFindings, scanGmail,
    type EmailConnection, type Finding, type FindingCategory,
} from '../../lib/email'

const CATEGORIES: Record<FindingCategory, { label: string; icon: LucideIcon }> = {
    bank:           { label: 'Bank accounts',    icon: Landmark },
    credit_card:    { label: 'Credit cards',     icon: CreditCard },
    investment:     { label: 'Investments',      icon: TrendingUp },
    insurance:      { label: 'Insurance',        icon: Shield },
    utility:        { label: 'Utilities',        icon: Zap },
    phone_internet: { label: 'Phone & internet', icon: Wifi },
    subscription:   { label: 'Subscriptions',    icon: Repeat },
}
const ORDER: FindingCategory[] = ['bank', 'credit_card', 'investment', 'insurance', 'utility', 'phone_internet', 'subscription']

const MESSAGES = {
    not_connected: 'Connect an email first, then we can look through it.',
    reconnect: 'Your email connection expired. Please connect it again.',
    error: 'Something went wrong while looking through your email. Please try again.',
}

function monthYear(iso: string | null) {
    return iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
}

export default function DisplayData() {
    const router = useRouter()
    const [connection, setConnection] = useState<EmailConnection | null>(null)
    const [findings, setFindings] = useState<Finding[]>([])
    const [loading, setLoading] = useState(true)
    const [scanning, setScanning] = useState(false)
    const [message, setMessage] = useState('')

    // Show the last scan right away (no waiting on Gmail)
    useFocusEffect(
        useCallback(() => {
            Promise.all([getEmailConnection(), getFindings()])
                .then(([c, f]) => { setConnection(c); setFindings(f) })
                .catch(() => setMessage(MESSAGES.error))
                .finally(() => setLoading(false))
        }, [])
    )

    async function scan() {
        if (scanning) return
        setScanning(true)
        setMessage('')
        const result = await scanGmail()
        if (result.ok) {
            setFindings(result.findings)
            if (result.findings.length === 0) setMessage('We didn\'t find any accounts or bills in this inbox.')
        } else {
            setMessage(MESSAGES[result.reason])
            if (result.reason !== 'error') setConnection(null)
        }
        setScanning(false)
    }

    async function dismiss(id: string) {
        const before = findings
        setFindings(findings.filter((f) => f.id !== id))   // hide right away
        try { await dismissFinding(id) } catch { setFindings(before) }
    }

    const groups = ORDER
        .map((cat) => ({ cat, items: findings.filter((f) => f.category === cat) }))
        .filter((g) => g.items.length > 0)

    return (
        <SafeAreaView style={styles.screen}>
            <BackArrow />

            <View style={styles.intro}>
                <Text style={type.title}>What we found</Text>
                <Text style={type.body}>
                    {connection
                        ? `Accounts and bills from ${connection.email}. We only look at who sent each email, never what it says.`
                        : 'Connect an email so we can look for accounts and bills.'}
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator color={colors.primaryDark} />
            ) : (
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    {message ? <Text style={styles.message}>{message}</Text> : null}

                    {groups.map(({ cat, items }) => {
                        const { label, icon: CatIcon } = CATEGORIES[cat]
                        return (
                            <View key={cat} style={styles.group}>
                                <Text style={type.section} accessibilityRole="header">{label}</Text>
                                <View style={styles.card}>
                                    {items.map((f, i) => (
                                        <View key={f.id} style={[styles.row, i < items.length - 1 && styles.divider]}>
                                            <View style={styles.iconCircle}>
                                                <CatIcon size={20} color={colors.primaryDark} strokeWidth={2} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.name}>{f.name}</Text>
                                                <Text style={styles.meta}>
                                                    {f.email_count} {f.email_count === 1 ? 'email' : 'emails'}
                                                    {f.last_seen ? ` · last ${monthYear(f.last_seen)}` : ''}
                                                </Text>
                                            </View>
                                            <Pressable onPress={() => dismiss(f.id)} style={styles.dismiss} accessibilityRole="button"
                                                accessibilityLabel={`${f.name} is not mine`}>
                                                <Text style={styles.dismissText}>Not mine</Text>
                                            </Pressable>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )
                    })}
                </ScrollView>
            )}

            <View style={styles.bottom}>
                {connection ? (
                    <Pressable
                        onPress={scan}
                        disabled={scanning}
                        style={({ pressed }) => [surfaces.button, (pressed || scanning) && { opacity: 0.85 }]}
                        accessibilityRole="button"
                    >
                        {scanning
                            ? <ActivityIndicator color={colors.textOnPrimary} />
                            : <Text style={type.button}>{findings.length ? 'Scan again' : 'Scan my email'}</Text>}
                    </Pressable>
                ) : (
                    <Pressable
                        onPress={() => router.push('/connectEmail')}
                        style={({ pressed }) => [surfaces.button, pressed && { opacity: 0.85 }]}
                        accessibilityRole="button"
                    >
                        <Text style={type.button}>Connect email</Text>
                    </Pressable>
                )}
                {scanning && <Text style={styles.hint}>This can take up to a minute.</Text>}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.lg },
    intro: { gap: space.md },
    list: { gap: space.lg, paddingBottom: space.lg },
    message: { ...type.body, color: colors.primaryDark },
    group: { gap: space.sm },
    card: { ...surfaces.card, paddingVertical: 0, paddingHorizontal: 0, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.md },
    divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    name: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
    meta: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted },
    dismiss: { minHeight: 44, justifyContent: 'center', paddingLeft: space.xs },
    dismissText: { fontFamily: fonts.medium, fontSize: 15, color: colors.primaryDark },
    bottom: { gap: space.xs },
    hint: { ...type.small, textAlign: 'center' },
})

// import { StyleSheet, Text, View } from 'react-native'
// import { SafeAreaView } from 'react-native-safe-area-context'
// import { colors, space, type } from '../../constants/theme'

// // placeholder for the messages screen
// export default function Inbox() {
//   return (
//     <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
//       <View style={styles.intro}>
//         <Text style={type.title}>Messages</Text>
//         <Text style={type.body}>Updates from family and the places you've contacted will show up here.</Text>
//       </View>
//     </SafeAreaView>
//   )
// }

// const styles = StyleSheet.create({
//   screen: {
//     flex: 1,
//     backgroundColor: colors.background,
//     paddingHorizontal: space.lg,
//   },
//   intro: {
//     marginTop: space.lg,
//     gap: space.md,
//   },
// })
