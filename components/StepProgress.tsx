import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Check } from 'lucide-react-native'
import { colors, fonts, space } from '../constants/theme'

const CIRCLE = 36
const TRACK = 6

type Props = {
    total: number
    current: number
    onStepPress?: (index: number) => void // lets users go back to a finished step (skips)
}

export function StepProgress({ total, current, onStepPress }: Props) {
    // For up to 5 steps, it uses the wide size columns and "step #" labels so it's easy to read
    // If there's more steps, the columns become narrower to fit on the phone size
    const showLabels = total <= 5
    const col = showLabels ? 64 : 40
    const filled = total > 1 ? (current / (total - 1)) * 100 : 0

    return (
        <View accessibilityRole="progressbar" accessibilityLabel={`Step ${current + 1} of ${total}`}>
            {total > 1 && (
                <View style={[styles.track, { left: col / 2, right: col / 2 }]}>
                    <View style={[styles.fill, { width: `${filled}%` }]} />
                </View>
            )}

            <View style={styles.row}>
                {Array.from({ length: total }, (_, i) => {
                    const done = i < current
                    const active = i === current
                    const canPress = !!onStepPress && done
                    return (
                        <Pressable
                            key={i}
                            disabled={!canPress}
                            onPress={() => onStepPress?.(i)}
                            style={[styles.col, { width: col }]}
                            accessibilityRole={canPress ? 'button' : undefined}
                            accessibilityLabel={`Step ${i + 1}${done ? ', done' : active ? ', current' : ''}`}
                        >
                            <View style={[styles.circle, (done || active) && styles.circleOn, active && styles.circleActive]}>
                                {done
                                    ? <Check size={18} color="#FFFFFF" strokeWidth={3} />
                                    : <Text style={[styles.num, active && styles.numOn]}>{i + 1}</Text>}
                            </View>
                            {showLabels && (
                                <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                                    Step {i + 1}
                                </Text>
                            )}
                        </Pressable>
                    )
                })}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    col: { alignItems: 'center', gap: space.xs },
    track: {
        position: 'absolute',
        top: CIRCLE / 2 - TRACK / 2,
        height: TRACK,
        borderRadius: TRACK / 2,
        backgroundColor: '#D9D6D0',
        overflow: 'hidden',
    },
    fill: { height: '100%', backgroundColor: colors.primaryDark },
    circle: {
        width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.surface, borderWidth: 2, borderColor: '#C9C5BE',
    },
    circleOn: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
    circleActive: { transform: [{ scale: 1.15 }], borderColor: colors.primarySoft, borderWidth: 3 },
    num: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted },
    numOn: { color: '#FFFFFF' },
    label: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
    labelActive: { fontFamily: fonts.bold, color: colors.text },
})