import { useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ExternalLink } from 'lucide-react-native'
import { colors, fonts, space, type, surfaces } from '../../../constants/theme'
import { BackArrow } from '../../../components/BackArrow'
import { getTask, setTaskStatus, type TaskDetail } from '../../../lib/tasks'


// WHat opens when user clicks "Walk me through it" from [id]/task.tsx page
// Has Back and Next to navigate through task steps so user moves one step at a time

// Fetch task steps
export default function TaskSteps() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const [task, setTask] = useState<TaskDetail | null>(null)
    const [step, setStep] = useState(0)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        getTask(id)
            .then((t) => { setTask(t); if (!t) setError('We couldn\'t find this task.') })
            .catch(() => setError('We couldn\'t load this task. Please try again.'))
    }, [id])

    async function finish() {
        if (saving) return
        setSaving(true)
        try {
            await setTaskStatus(id, 'done')
            router.dismissTo('/tasks')   // close both task screens and return to the list
        } catch {
            setError('We couldn\'t mark this complete. Please try again.')
            setSaving(false)
        }
    }

    if (!task) {
        return (
            <SafeAreaView style={styles.screen}>
                <View style={styles.inner}>
                    <BackArrow />
                    {error ? <Text style={type.body}>{error}</Text> : <ActivityIndicator color={colors.primaryDark} />}
                </View>
            </SafeAreaView>
        )
    }

    const total = task.steps.length
    const isFirst = step === 0
    const isLast = step === total - 1

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.inner}>
                <BackArrow />

                {/* Progress bar: one chunk per step */}
                <View style={styles.progress} accessibilityLabel={`Step ${step + 1} of ${total}`}>
                    {task.steps.map((_, i) => (
                        <View key={i} style={[styles.segment, i <= step && styles.segmentDone]} />
                    ))}
                </View>

                <View style={{ gap: space.xs }}>
                    <Text style={styles.stepLabel}>Step {step + 1} of {total}</Text>
                    <Text style={type.cardTitle}>{task.title}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.stepText}>{task.steps[step]}</Text>
                </View>

                {task.link ? (
                    <Pressable onPress={() => Linking.openURL(task.link!)} style={styles.linkRow} accessibilityRole="link">
                        <Text style={type.link}>Open the website</Text>
                        <ExternalLink size={18} color={colors.primaryDark} strokeWidth={2} />
                    </Pressable>
                ) : null}

                {error ? <Text style={type.error}>{error}</Text> : null}

                <View style={{ flex: 1 }} />

                <View style={styles.buttons}>
                    {!isFirst && (
                        <Pressable onPress={() => setStep(step - 1)} style={styles.backButton} accessibilityRole="button">
                            <Text style={styles.backText}>Back</Text>
                        </Pressable>
                    )}
                    <Pressable
                        onPress={() => (isLast ? finish() : setStep(step + 1))}
                        disabled={saving}
                        style={({ pressed }) => [surfaces.button, { flex: 1 }, (pressed || saving) && { opacity: 0.8 }]}
                        accessibilityRole="button"
                    >
                        {saving
                            ? <ActivityIndicator color={colors.textOnPrimary} />
                            : <Text style={type.button}>{isLast ? 'Mark task complete' : 'Done, next step'}</Text>}
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    inner: { flex: 1, paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.lg },
    progress: { flexDirection: 'row', gap: space.xs },
    segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border },
    segmentDone: { backgroundColor: colors.primaryDark },
    stepLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.primaryDark },
    card: { ...surfaces.card },
    stepText: { ...type.body, color: colors.text },
    linkRow: { ...surfaces.textButton, flexDirection: 'row', gap: space.xs, alignSelf: 'flex-start' },
    buttons: { flexDirection: 'row', gap: space.sm },
    backButton: {
        minHeight: 60, paddingHorizontal: space.lg, borderRadius: 16, borderWidth: 1.5,
        borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center',
    },
    backText: { fontFamily: fonts.semibold, fontSize: 18, color: colors.text },
})