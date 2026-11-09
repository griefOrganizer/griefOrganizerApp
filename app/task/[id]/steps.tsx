import { useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, ExternalLink } from 'lucide-react-native'
import { colors, fonts, space, type, surfaces } from '../../../constants/theme'
import { TaskHeader } from '../../../components/TaskHeader'
import { StepProgress } from '../../../components/StepProgress'
import { getTask, setTaskStatus, type TaskDetail } from '../../../lib/tasks'

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
            router.dismissTo('/tasks')
        } catch {
            setError('We couldn\'t mark this complete. Please try again.')
            setSaving(false)
        }
    }

    if (!task) {
        return (
            <View style={styles.screen}>
                <TaskHeader title="Loading…" />
                <View style={styles.body}>
                    {error ? <Text style={type.body}>{error}</Text> : <ActivityIndicator color={colors.primaryDark} />}
                </View>
            </View>
        )
    }

    const total = task.steps.length
    const isFirst = step === 0
    const isLast = step === total - 1

    return (
        <View style={styles.screen}>
            <TaskHeader title={task.title} />

            <View style={styles.body}>
                <StepProgress total={total} current={step} onStepPress={setStep} />

                <View style={styles.card}>
                    <Text style={styles.stepLabel}>Step {step + 1} of {total}</Text>
                    <Text style={styles.stepText}>{task.steps[step]}</Text>
                </View>

                {task.link ? (
                    <Pressable onPress={() => Linking.openURL(task.link!)} style={styles.linkRow} accessibilityRole="link">
                        <Text style={type.link}>Open the website</Text>
                        <ExternalLink size={18} color={colors.primaryDark} strokeWidth={2} />
                    </Pressable>
                ) : null}

                {error ? <Text style={type.error}>{error}</Text> : null}
            </View>

            <SafeAreaView edges={['bottom']} style={styles.buttons}>
                {!isFirst && (
                    <Pressable
                        onPress={() => setStep(step - 1)}
                        style={({ pressed }) => [styles.arrowButton, pressed && { opacity: 0.7 }]}
                        accessibilityRole="button"
                        accessibilityLabel="Previous step"
                    >
                        <ArrowLeft size={28} color={colors.text} strokeWidth={2.5} />
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
            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    body: { flex: 1, paddingHorizontal: space.lg, paddingTop: space.xl, gap: space.xl },
    card: { ...surfaces.card, gap: space.sm },
    stepLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.primaryDark },
    stepText: { ...type.body, color: colors.text },
    linkRow: { ...surfaces.textButton, flexDirection: 'row', gap: space.xs, alignSelf: 'flex-start' },
    buttons: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.sm },
    arrowButton: {
        width: 60, minHeight: 60, borderRadius: 16, borderWidth: 1.5,
        borderColor: colors.textMuted, backgroundColor: colors.surface,
        alignItems: 'center', justifyContent: 'center',
    },
})