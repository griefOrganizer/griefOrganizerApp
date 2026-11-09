import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { Check, CircleCheck } from 'lucide-react-native'
import { colors, fonts, space, type, surfaces } from '../constants/theme'
import { BackArrow } from '../components/BackArrow'
import {
    connectGmail, disconnectEmail, getEmailConnection,
    type ConnectResult, type EmailConnection,
} from '../lib/email'

const PROMISES = [
    'You sign in on Google\'s own page. We never see the password.',
    'Read-only. We can\'t send, delete or change anything.',
    'Disconnect anytime from your profile.',
]

const MESSAGES: Record<Exclude<ConnectResult, 'success'>, string> = {
    cancelled: 'No problem. You can connect your email anytime.',
    missing_permission: 'Google didn\'t give us permission to read email. Try again and leave the "Read your email" box checked.',
    expired: 'That took a little too long. Please try again.',
    error: 'Something went wrong connecting your email. Please try again.',
}

export default function ConnectEmail() {
    const router = useRouter()
    const [connection, setConnection] = useState<EmailConnection | null>(null)
    const [checking, setChecking] = useState(true)
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState('')

    // Already connected? Check every time the screen opens.
    useFocusEffect(
        useCallback(() => {
            getEmailConnection()
                .then(setConnection)
                .catch(() => setConnection(null))
                .finally(() => setChecking(false))
        }, [])
    )

    async function handleGoogle() {
        if (busy) return
        setBusy(true)
        setMessage('')
        const result = await connectGmail()
        if (result === 'success') {
            setConnection(await getEmailConnection().catch(() => null))
        } else {
            setMessage(MESSAGES[result] ?? MESSAGES.error)
        }
        setBusy(false)
    }

    async function handleDisconnect() {
        if (busy) return
        setBusy(true)
        try {
            await disconnectEmail()
            setConnection(null)
        } catch {
            setMessage('We couldn\'t disconnect your email. Please try again.')
        } finally {
            setBusy(false)
        }
    }

    const skipConnection = () => router.push('/takeTime')

    if (checking) {
        return (
            <SafeAreaView style={[styles.screen, { justifyContent: 'center' }]}>
                <ActivityIndicator color={colors.primaryDark} />
            </SafeAreaView>
        )
    }

    // !!! ALREADY CONNECTED !!!
    if (connection) {
        return (
            <SafeAreaView style={styles.screen}>
                <BackArrow />
                <View style={styles.intro}>
                    <CircleCheck size={56} color={colors.success} strokeWidth={2} />
                    <Text style={type.title}>Email connected</Text>
                    <Text style={type.body}>
                        We'll quietly look through it for accounts and bills. There's no need to wait here.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.connectedLabel}>Connected inbox</Text>
                    <Text style={styles.connectedEmail}>{connection.email}</Text>
                    <Text style={type.small}>Read-only</Text>
                </View>

                {message ? <Text style={type.error}>{message}</Text> : null}

                <View style={styles.bottom}>
                    <Pressable onPress={skipConnection} style={({ pressed }) => [surfaces.button, pressed && { opacity: 0.85 }]} accessibilityRole="button">
                        <Text style={type.button}>Continue</Text>
                    </Pressable>
                    <Pressable onPress={handleDisconnect} disabled={busy} style={surfaces.textButton} accessibilityRole="button">
                        <Text style={type.link}>{busy ? 'Disconnecting…' : 'Disconnect this email'}</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        )
    }

    // !!! NOT CONNECTED YET
    // (prompt for OAuth)
    return (
        <SafeAreaView style={styles.screen}>
            <BackArrow />

            <View style={styles.intro}>
                <Text style={styles.eyebrow}>Optional</Text>
                <Text style={type.title}>Connect your email</Text>
                <Text style={type.body}> We'll look for bank accounts, bills, and subscriptions so you don't have to dig through years of mail yourself.</Text>
            </View>

            <View style={styles.card}>
                {PROMISES.map((p) => (
                    <View key={p} style={styles.promiseRow}>
                        <Check size={24} color={colors.success} strokeWidth={2.5} />
                        <Text style={styles.promiseText}>{p}</Text>
                    </View>
                ))}
            </View>

            {message ? <Text style={styles.message}>{message}</Text> : null}

            <View style={styles.bottom}>
                <Pressable
                    onPress={handleGoogle}
                    disabled={busy}
                    style={({ pressed }) => [surfaces.button, (pressed || busy) && { opacity: 0.85 }]}
                    accessibilityRole="button"
                    accessibilityHint="Opens Google's sign-in page"
                >
                    {busy ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={type.button}>Continue with Google</Text>}
                </Pressable>

                <Pressable onPress={skipConnection} style={surfaces.textButton} accessibilityRole="button">
                    <Text style={type.link}>Skip, I'll add things myself</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.xl },
    intro: { gap: space.md },
    eyebrow: { fontFamily: fonts.bold, fontSize: 17, color: colors.primaryDark },
    card: { ...surfaces.card, gap: space.lg },
    promiseRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
    promiseText: { ...type.cardSubtitle, flex: 1, color: colors.text },
    message: { ...type.body, color: colors.primaryDark },
    connectedLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.textMuted },
    connectedEmail: { ...type.cardTitle },
    bottom: { flex: 1, justifyContent: 'flex-end', gap: space.xs },
})