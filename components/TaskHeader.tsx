import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Clock } from 'lucide-react-native'
import { colors, fonts, space, type } from '../constants/theme'

// header background has to be darker than colors.primary so the white text on top is actually readable
// kept out of constants/themes for simplicity
const HEADER_BG = '#5B7FB5'

type Props = {
    title: string
    oval?: string                                           // oval that says the time estimatino
    badge?: { text: string; tone: 'waiting' | 'done' }      // small status label above the title
}

export function TaskHeader({ title, oval, badge }: Props) {
    const router = useRouter()
    const insets = useSafeAreaInsets()

    return (
        <View style={styles.wrap}>
            <View style={[styles.band, { paddingTop: insets.top + space.xs, paddingBottom: oval ? 48 : space.lg }]}>
                <Pressable
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/tasks'))}
                    style={styles.back}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    hitSlop={8}
                >
                    <ChevronLeft size={32} color="#FFFFFF" strokeWidth={2.5} />
                </Pressable>

                {badge && (
                    <View style={[styles.badge, badge.tone === 'done' && styles.badgeDone]}>
                        <Text style={styles.badgeText}>{badge.text}</Text>
                    </View>
                )}

                <Text style={styles.title} accessibilityRole="header">{title}</Text>
            </View>

            {oval ? (
                <View style={styles.oval}>
                    <Clock size={22} color={colors.primaryDark} strokeWidth={2.2} />
                    <Text style={styles.ovalText}>{oval}</Text>
                </View>
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    wrap: { zIndex: 2 },
    band: {
        backgroundColor: HEADER_BG,
        paddingHorizontal: space.lg,
        alignItems: 'center',
        gap: space.sm,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 2.5,
        elevation: 4,
    },
    back: { alignSelf: 'flex-start', width: 44, height: 44, justifyContent: 'center', marginLeft: -10 },
    title: { ...type.title, fontSize: 30, lineHeight: 36, color: '#FFFFFF', textAlign: 'center' },
    badge: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: space.md, paddingVertical: 4, borderRadius: 999 },
    badgeDone: { backgroundColor: 'rgba(47,122,85,0.85)' },
    badgeText: { fontFamily: fonts.semibold, fontSize: 14, color: '#FFFFFF' },
    oval: {
        alignSelf: 'center',
        marginTop: -30,                          // overlaps the bottom edge of the blue rectangle
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        backgroundColor: colors.primarySoft,
        paddingHorizontal: space.xl,
        paddingVertical: space.md,
        borderRadius: 999,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 2.5,
        elevation: 6,                            // higher than the shadow band so it's on top for Android phones
    },
    ovalText: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
})