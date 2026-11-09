import { useCallback, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { Check, ExternalLink } from 'lucide-react-native'
import { colors, fonts, space, type, surfaces } from '../../../constants/theme'
import { TaskHeader } from '../../../components/TaskHeader'
import { getTask, setTaskStatus, type TaskDetail, type TaskStatus } from '../../../lib/tasks'

export default function TaskOverview() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const [task, setTask] = useState<TaskDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    useFocusEffect(
        useCallback(() => {
            let active = true
            getTask(id)
                .then((t) => { if (active) { setTask(t); setError(t ? '' : 'We couldn\'t find this task.') } })
                .catch(() => { if (active) setError('We couldn\'t load this task. Please try again.') })
                .finally(() => { if (active) setLoading(false) })
            return () => { active = false }
        }, [id])
    )

    async function changeStatus(status: TaskStatus) {
        if (!task || saving) return
        setSaving(true)
        try {
            await setTaskStatus(task.id, status)
            if (status === 'ready') setTask({ ...task, status, completedAt: null })
            else router.back()
        } catch {
            setError('We couldn\'t update this task. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading || !task) {
        return (
            <View style={styles.screen}>
                <TaskHeader title={loading ? 'Loading…' : 'Task'} />
                <View style={styles.content}>
                    {loading ? <ActivityIndicator color={colors.primaryDark} /> : <Text style={type.body}>{error}</Text>}
                </View>
            </View>
        )
    }

    const hasSteps = task.steps.length > 0
    const isDone = task.status === 'done'
    const completedOn = task.completedAt
        ? new Date(task.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
        : null
    const badge =
        isDone ? { text: `Completed${completedOn ? ` ${completedOn}` : ''}`, tone: 'done' as const } :
        task.status === 'waiting' ? { text: 'Waiting on someone', tone: 'waiting' as const } :
        undefined

    return (
        <View style={styles.screen}>
            <TaskHeader title={task.title} oval={task.duration} badge={badge} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {(hasSteps || task.needs.length > 0) && (
                    <View style={styles.tiles}>
                        {hasSteps && (
                            <View style={styles.tile}>
                                <Text style={styles.tileValue}>{task.steps.length} {task.steps.length === 1 ? 'step' : 'steps'}</Text>
                                <Text style={styles.tileLabel}>One at a time</Text>
                            </View>
                        )}
                        {task.needs.length > 0 && (
                            <View style={styles.tile}>
                                <Text style={styles.tileValue}>{task.needs.length} {task.needs.length === 1 ? 'thing' : 'things'}</Text>
                                <Text style={styles.tileLabel}>To have ready</Text>
                            </View>
                        )}
                    </View>
                )}

                {task.details ? <Text style={type.body}>{task.details}</Text> : null}

                {task.needs.length > 0 && (
                    <View style={styles.section}>
                        <Text style={type.section} accessibilityRole="header">Have these ready</Text>
                        <View style={styles.card}>
                            {task.needs.map((need, i) => (
                                <View key={i} style={styles.needRow}>
                                    <Check size={20} color={colors.success} strokeWidth={2.5} />
                                    <Text style={styles.needText}>{need}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {task.link ? (
                    <Pressable onPress={() => Linking.openURL(task.link!)} style={styles.linkRow} accessibilityRole="link">
                        <Text style={type.link}>Open the website</Text>
                        <ExternalLink size={18} color={colors.primaryDark} strokeWidth={2} />
                    </Pressable>
                ) : null}

                {error ? <Text style={type.error}>{error}</Text> : null}
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={styles.actions}>
                {isDone ? (
                    <Pressable onPress={() => changeStatus('ready')} disabled={saving} style={surfaces.textButton} accessibilityRole="button">
                        <Text style={type.link}>Move back to ready</Text>
                    </Pressable>
                ) : (
                    <>
                        <Pressable
                            onPress={() => (hasSteps ? router.push(`/task/${task.id}/steps`) : changeStatus('done'))}
                            disabled={saving}
                            style={({ pressed }) => [surfaces.button, (pressed || saving) && { opacity: 0.8 }]}
                            accessibilityRole="button"
                        >
                            {saving
                                ? <ActivityIndicator color={colors.textOnPrimary} />
                                : <Text style={type.button}>{hasSteps ? 'Walk me through it' : 'Mark as complete'}</Text>}
                        </Pressable>

                        <View style={styles.secondaryRow}>
                            {hasSteps && (
                                <Pressable onPress={() => changeStatus('done')} disabled={saving} style={surfaces.textButton} accessibilityRole="button">
                                    <Text style={type.link}>Already done</Text>
                                </Pressable>
                            )}
                            <Pressable
                                onPress={() => changeStatus(task.status === 'waiting' ? 'ready' : 'waiting')}
                                disabled={saving}
                                style={surfaces.textButton}
                                accessibilityRole="button"
                            >
                                <Text style={type.link}>{task.status === 'waiting' ? 'Move back to ready' : 'Waiting on someone'}</Text>
                            </Pressable>
                        </View>
                    </>
                )}
            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xl, gap: space.lg },

    tiles: { flexDirection: 'row', gap: space.md },
    tile: { ...surfaces.cardHighlighted, borderColor: colors.primaryDark, flex: 1, alignItems: 'center', paddingVertical: space.lg, gap: 2 },
    tileValue: { fontFamily: fonts.bold, fontSize: 22, color: colors.primaryDark },
    tileLabel: { fontFamily: fonts.regular, fontSize: 16, color: colors.primaryDark },

    section: { gap: space.sm },
    card: { ...surfaces.card, gap: space.md },
    needRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
    needText: { ...type.cardSubtitle, flex: 1, color: colors.text },
    linkRow: { ...surfaces.textButton, flexDirection: 'row', gap: space.xs, alignSelf: 'flex-start' },

    actions: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.xs, backgroundColor: colors.background },
    secondaryRow: { flexDirection: 'row', justifyContent: 'center', gap: space.lg },
})