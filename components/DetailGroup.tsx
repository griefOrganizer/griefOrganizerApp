import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react-native'
import { colors, fonts, space, type, surfaces } from '../constants/theme'

export function DetailGroup({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View style={styles.group}>
            <Text style={type.section} accessibilityRole="header">{title}</Text>
            <View style={styles.card}>{children}</View>
        </View>
    )
}

type DetailRowProps = {
    label: string
    value: string | null
    onPress?: () => void   // leave out for read-only rows
    last?: boolean         // the last row in a group has no divider below it
}

export function DetailRow({ label, value, onPress, last }: DetailRowProps) {
    const content = (
        <>
            <View style={styles.text}>
                <Text style={styles.label}>{label}</Text>
                {value
                    ? <Text style={styles.value}>{value}</Text>
                    : <Text style={styles.add}>{onPress ? 'Add' : 'Not added'}</Text>}
            </View>
            {onPress ? <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} /> : null}
        </>
    )

    if (!onPress) {
        return <View style={[styles.row, !last && styles.divider]}>{content}</View>
    }
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.row, !last && styles.divider, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${value ?? 'not added'}`}
            accessibilityHint="Opens an editor for this detail"
        >
            {content}
        </Pressable>
    )
}

const styles = StyleSheet.create({
    group: {gap: space.sm},
    card: {
        ...surfaces.card, paddingVertical: 0,
        paddingHorizontal: 0,
        overflow: 'hidden'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        minHeight: 64,
        paddingVertical: space.sm,
        paddingHorizontal: 20,
    },
    divider: { 
        borderBottomWidth: StyleSheet.hairlineWidth, 
        borderBottomColor: colors.border
    },
    pressed: { 
        backgroundColor: colors.primarySoft
    },
    text: { 
        flex: 1, 
        gap: 2
    },
    label: { 
        fontFamily: fonts.medium, 
        fontSize: 15, 
        color: colors.textMuted
    },
    value: { 
        ...type.cardSubtitle, 
        color: colors.text
    },
    add: { 
        fontFamily: fonts.semibold, 
        fontSize: 17, 
        color: colors.primaryDark
    },
})