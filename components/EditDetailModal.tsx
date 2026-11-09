import { useEffect, useState } from 'react'
import {
    ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { colors, space, type, surfaces } from '../constants/theme'
import { TextBox } from './TextBox'
import { updateProfileField, type ProfileColumn } from '../lib/profile'
import {
    digitsOnly, formatPhone, fromISODate, toISODate, MIN_BIRTHDAY,
    validateBirthday, validateEmail, validateName, validatePhone, validatePlace,
} from '../lib/validation'

export type EditableField = {
    column: ProfileColumn
    label: string
    kind: 'name' | 'place' | 'phone' | 'email' | 'date'
    value: string | null    // as stored in Supabase
}

type Props = {
    field: EditableField | null   // null = closed
    onClose: () => void
    onSaved: () => void
}

const DATE_START = new Date(1970, 0, 1)

export function EditDetailModal({ field, onClose, onSaved }: Props) {
    const [text, setText] = useState('')
    const [date, setDate] = useState<Date | null>(null)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [showAndroidPicker, setShowAndroidPicker] = useState(false)

    // Load the current value each time a field is opened
    useEffect(() => {
        if (!field) return
        setError('')
        setSaving(false)
        if (field.kind === 'date') setDate(field.value ? fromISODate(field.value) : null)
        else if (field.kind === 'phone') setText(field.value ? formatPhone(field.value) : '')
        else setText(field.value ?? '')
    }, [field])

    if (!field) return null

    // Check the input and convert it to what the database stores
    function prepare(): { error: string; value: string | null } {
        switch (field!.kind) {
            case 'name':  return { error: validateName(text, field!.label),  value: text.trim() || null }
            case 'place': return { error: validatePlace(text, field!.label), value: text.trim() || null }
            case 'phone': return { error: validatePhone(text),               value: digitsOnly(text) || null }
            case 'email': return { error: validateEmail(text),               value: text.trim().toLowerCase() || null }
            case 'date':  return { error: validateBirthday(date),            value: date ? toISODate(date) : null }
        }
    }

    async function save() {
        if (saving) return
        const { error: problem, value } = prepare()
        if (problem) { setError(problem); return }
        setSaving(true)
        try {
            await updateProfileField(field!.column, value)
            onSaved()
            onClose()
        } catch (e: any) {
            setError(e?.code === '23514'
                ? 'That doesn\'t look right. Please check it and try again.'
                : 'We couldn\'t save this. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const hasValue = field.kind === 'date' ? !!date : !!text
    const inputProps =
        field.kind === 'phone' ? { keyboardType: 'phone-pad' as const, maxLength: 14, placeholder: '(313) 555-0123' } :
        field.kind === 'email' ? { keyboardType: 'email-address' as const, autoCapitalize: 'none' as const, autoCorrect: false, placeholder: 'you@example.com' } :
        { autoCapitalize: 'words' as const, maxLength: 50 }

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Pressable style={surfaces.backdrop} onPress={onClose} accessibilityLabel="Close editor">
                    {/* stopPropagation: taps on the card don't count as taps on the backdrop */}
                    <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.title} accessibilityRole="header">Edit {field.label.toLowerCase()}</Text>

                        {field.kind === 'date' ? (
                            <View style={styles.dateArea}>
                                {Platform.OS === 'android' && (
                                    <Pressable onPress={() => setShowAndroidPicker(true)} style={surfaces.textButton} accessibilityRole="button">
                                        <Text style={type.link}>
                                            {date ? date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Choose a date'}
                                        </Text>
                                    </Pressable>
                                )}
                                {(Platform.OS === 'ios' || showAndroidPicker) && (
                                    <DateTimePicker
                                        textColor={colors.textBody}
                                        accentColor={colors.primary}
                                        value={date ?? DATE_START}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        minimumDate={MIN_BIRTHDAY}
                                        maximumDate={new Date()}
                                        onValueChange={(event, selected) => {
                                            if (Platform.OS === 'android') setShowAndroidPicker(false)
                                            if (selected) { setDate(selected); setError('') }
                                        }}
                                    />
                                )}
                                {error ? <Text style={type.error}>{error}</Text> : null}
                            </View>
                        ) : (
                            <TextBox
                                label={field.label}
                                value={text}
                                onChangeText={(v) => { setText(field.kind === 'phone' ? formatPhone(v) : v); setError('') }}
                                error={error}
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={save}
                                {...inputProps}
                            />
                        )}

                        <View style={styles.actions}>
                            {hasValue ? (
                                <Pressable
                                    onPress={() => { field.kind === 'date' ? setDate(null) : setText(''); setError('') }}
                                    style={styles.clear}
                                    accessibilityRole="button"
                                >
                                    <Text style={type.link}>Clear</Text>
                                </Pressable>
                            ) : <View style={{ flex: 1 }} />}

                            <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
                                <Text style={type.link}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={save}
                                disabled={saving}
                                style={({ pressed }) => [styles.save, (pressed || saving) && { opacity: 0.8 }]}
                                accessibilityRole="button"
                            >
                                {saving ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={type.button}>Save</Text>}
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    )
}

const styles = StyleSheet.create({
    card: { ...surfaces.modal, gap: space.md },
    title: { ...type.cardTitle },
    dateArea: { alignItems: 'center', gap: space.sm },
    actions: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs },
    clear: { ...surfaces.textButton, flex: 1, alignItems: 'flex-start' },
    cancel: { ...surfaces.textButton, paddingHorizontal: space.sm },
    save: { ...surfaces.button, minHeight: 48, paddingHorizontal: space.lg },
})