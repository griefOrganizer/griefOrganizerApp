import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import {
    CreditCard, Dumbbell, Globe, Home, Landmark, Pill, PiggyBank, Receipt, Repeat, Shield,
    TrendingUp, User, Wifi, Zap, type LucideIcon,
} from 'lucide-react-native'
import { colors, fonts, space, type, surfaces } from '../../constants/theme'
import {
    dismissFinding, getEmailConnection, getFindings, scanGmail,
    type EmailConnection, type Finding, type FindingCategory,
} from '../../lib/email'

// Each group, and what the user will eventually need to do about it
const CATEGORIES: Record<FindingCategory, { label: string; action: string; icon: LucideIcon }> = {
    bank: { label: 'Bank accounts and money apps', action: 'Close or transfer', icon: Landmark },
    credit_card: { label: 'Credit cards', action: 'Pay off and close', icon: CreditCard },
    investment: { label: 'Investments', action: 'Transfer to the estate', icon: TrendingUp },
    retirement: { label: 'Retirement and pensions', action: 'File a beneficiary claim', icon: PiggyBank },
    insurance: { label: 'Insurance', action: 'File a claim or cancel', icon: Shield },
    housing: { label: 'Rent and mortgage', action: 'Let the landlord or lender know', icon: Home },
    utility: { label: 'Utilities', action: 'Transfer or stop service', icon: Zap },
    phone_internet: { label: 'Phone and internet', action: 'Cancel or transfer', icon: Wifi },
    subscription: { label: 'Subscriptions', action: 'Cancel', icon: Repeat },
    membership: { label: 'Memberships', action: 'Cancel', icon: Dumbbell },
    online_account: { label: 'Online accounts', action: 'Close or memorialize', icon: Globe },
    health: { label: 'Health and pharmacy', action: 'Stop refills and let providers know', icon: Pill },
    other_bill: { label: 'Other bills', action: 'Review', icon: Receipt },
    personal: { label: 'People to let know', action: 'Reach out when you\'re ready', icon: User },
}
const ORDER: FindingCategory[] = [
    'bank', 'credit_card', 'investment', 'retirement', 'insurance', 'housing', 'utility',
    'phone_internet', 'subscription', 'membership', 'online_account', 'health', 'other_bill', 'personal',
]

const MESSAGES = {
    not_connected: 'Connect an email first, then we can look through it.',
    reconnect: 'Your email connection expired. Please connect it again.',
    error: 'Something went wrong while looking through your email. Please try again.',
}

function monthYear(iso: string | null) {
    return iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
}

export default function EmailData() {
    const router = useRouter()
    const [connection, setConnection] = useState<EmailConnection | null>(null)
    const [findings, setFindings] = useState<Finding[]>([])
    const [loading, setLoading] = useState(true)
    const [scanning, setScanning] = useState(false)
    const [message, setMessage] = useState('')
    const [confirming, setConfirming] = useState<Finding | null>(null)   // the finding waiting for "yes hide it"

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

    function confirmDismiss() {
        if (!confirming) return
        const id = confirming.id
        setConfirming(null)   // close the pop-up first
        dismiss(id)           // then hide it (your existing function)
    }

    const groups = ORDER
        .map((cat) => ({ cat, items: findings.filter((f) => f.category === cat) }))
        .filter((g) => g.items.length > 0)

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.intro}>
                <Text style={styles.title}>What we found</Text>
                <Text style={styles.body}>
                    {connection ? (
                        <>
                            Accounts and bills from <Text style={styles.blueText}>{connection.email}</Text>. We will never share or sell any of your data.
                        </>
                    ) : (
                        'Connect an email so we can look for accounts and bills.'
                    )}
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator color={colors.primaryDark} />
            ) : (
                <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    {message ? <Text style={styles.message}>{message}</Text> : null}
                    {!message && connection && groups.length === 0 ? (
                        <Text style={styles.message}>No saved scan results yet. Tap the Scan my email button below to look for accounts and bills.</Text>
                    ) : null}

                    {groups.map(({ cat, items }) => {
                        const { label, action, icon: CatIcon } = CATEGORIES[cat]
                        return (
                            <View key={cat} style={styles.group}>
                                <View>
                                    <Text style={type.section} accessibilityRole="header">{label}</Text>
                                    <Text style={styles.action}>{action}</Text>
                                </View>
                                <View style={styles.card}>
                                    {items.map((f, i) => (
                                        <View key={f.id} style={[styles.row, i < items.length - 1 && styles.divider]}>
                                            <View style={styles.iconCircle}>
                                                <CatIcon size={20} color={colors.primaryDark} strokeWidth={2} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.name}>{f.name}</Text>
                                                <Text style={styles.meta}>
                                                    {f.account_last4 ? `Account ending ${f.account_last4} · ` : ''}
                                                    {f.email_count} {f.email_count === 1 ? 'email' : 'emails'}
                                                    {f.last_seen ? ` · last ${monthYear(f.last_seen)}` : ''}
                                                </Text>
                                            </View>
                                            {/* <Pressable onPress={() => dismiss(f.id)} style={styles.dismiss} accessibilityRole="button"
                                                accessibilityLabel={`${f.name} is not mine`}>
                                                <Text style={styles.dismissText}>Not mine</Text>
                                            </Pressable> */}
                                            <Pressable onPress={() => setConfirming(f)} style={styles.dismiss} accessibilityRole="button"
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
            <Modal
                visible={!!confirming}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirming(null)}
            >
                <Pressable style={surfaces.backdrop} onPress={() => setConfirming(null)} accessibilityLabel="Cancel">
                    {/* stopPropagation: taps on the card don't close it */}
                    <Pressable style={styles.confirmCard} onPress={(e) => e.stopPropagation()} accessibilityViewIsModal>
                        <Text style={type.cardTitle} accessibilityRole="header">
                            Is {confirming?.name} not yours?
                        </Text>
                        <Text style={type.cardSubtitle}>
                            We&apos;ll hide {confirming?.name} from what we found, and it won&apos;t come back when you scan again.
                        </Text>

                        <View style={styles.confirmButtons}>
                            <Pressable
                                onPress={confirmDismiss}
                                style={({ pressed }) => [styles.confirmYes, pressed && { opacity: 0.85 }]}
                                accessibilityRole="button"
                            >
                                <Text style={type.button}>Yes, it&apos;s not mine</Text>
                            </Pressable>
                            <Pressable onPress={() => setConfirming(null)} style={surfaces.textButton} accessibilityRole="button">
                                <Text style={type.link}>Keep it</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.md },
    // header matches the Tasks and Profile screens so the title doesn't jump when switching tabs
    intro: { paddingTop: space.md, gap: space.xxs },
    title: { ...type.title, fontSize: 30, lineHeight: 36 },
    body: { ...type.body, lineHeight: 24 },
    scroll: { flex: 1 },
    list: { gap: space.lg, paddingBottom: space.lg },
    message: { ...type.body, color: colors.primaryDark },
    group: { gap: space.sm },
    action: { fontFamily: fonts.medium, fontSize: 15, color: colors.textMuted },
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
    confirmCard: { ...surfaces.modal, gap: space.md },
    confirmButtons: { gap: space.xs, marginTop: space.sm },
    confirmYes: { ...surfaces.button, backgroundColor: colors.error },
    blueText: { color: colors.primaryDark, fontFamily: fonts.bold }
})