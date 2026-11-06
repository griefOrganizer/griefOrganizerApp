import { useState, type ComponentRef, type Ref } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { Eye, EyeOff } from 'lucide-react-native'
import { colors, fonts, radius, space, type } from '../constants/theme'

const ERROR = '#B3261E'

type TextBoxProps = TextInputProps & {
    label: string
    error?: string
    password?: boolean // hides the text and adds a show/hide button
    ref?: Ref<ComponentRef<typeof TextInput>>
    }

    export function TextBox({ label, error, password = false, ref, style, onFocus, onBlur, ...inputProps }: TextBoxProps) {
    const [focused, setFocused] = useState(false)
    const [hidden, setHidden] = useState(true)

    const borderColor = error ? ERROR : focused ? colors.primary : colors.border

    return (
        <View style={styles.wrapper}>
        <Text style={styles.label}>{label}</Text>

        <View style={[styles.field, { borderColor, borderWidth: focused || error ? 2 : 1 }]}>
            <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={password && hidden}
            accessibilityLabel={label}
            onFocus={(e) => { setFocused(true); onFocus?.(e) }}
            onBlur={(e) => { setFocused(false); onBlur?.(e) }}
            {...inputProps}
            />

            {password && (
            <Pressable
                onPress={() => setHidden((h) => !h)}
                style={styles.eye}
                accessibilityRole="button"
                accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
                hitSlop={8}
            >
                {hidden
                ? <Eye size={22} color={colors.textMuted} strokeWidth={2} />
                : <EyeOff size={22} color={colors.textMuted} strokeWidth={2} />}
            </Pressable>
            )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    )
    }

    const styles = StyleSheet.create({
    wrapper: { gap: space.xs },
    label: { ...type.label, fontSize: 16 },
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 54,
        backgroundColor: colors.surface,
        borderRadius: radius.button,
        paddingHorizontal: space.md,
    },
    input: {
        flex: 1,
        height: '100%',
        fontFamily: fonts.regular,
        fontSize: 17,
        color: colors.text,
    },
    eye: { paddingLeft: space.sm, height: 44, justifyContent: 'center' },
    error: { ...type.small, color: ERROR },
})