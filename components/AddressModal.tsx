// for user details autofill address feature
// user types and address, picks a match for their address, then county and state automatically populate and get saved.
// if the typed address can’t be found, there’s a link to type the county and state by hand

import { useEffect, useState } from 'react'
import {
    ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View,
} from 'react-native'
import { MapPin } from 'lucide-react-native'
import { colors, fonts, space, type, surfaces } from '../constants/theme'
import { TextBox } from './TextBox'
import { searchAddresses, type AddressSuggestion } from '../lib/address'
import { updateProfileFields } from '../lib/profile'
import { validatePlace } from '../lib/validation'

type Props = {
    visible: boolean
    currentCounty: string | null
    currentState: string | null
    onClose: () => void
    onSaved: () => void
}

export function AddressModal({ visible, currentCounty, currentState, onClose, onSaved }: Props) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<AddressSuggestion[]>([])
    const [searching, setSearching] = useState(false)
    const [manual, setManual] = useState(false)
    const [county, setCounty] = useState('')
    const [state, setState] = useState('')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    // Reset every time the pop-up opens
    useEffect(() => {
        if (!visible) return
        setQuery(''); setResults([]); setError(''); setManual(false)
        setCounty(currentCounty ?? ''); setState(currentState ?? '')
    }, [visible])

    // Search as the user types: wait until they pause, and cancel searches that are out of date
    useEffect(() => {
        const text = query.trim()
        if (text.length < 3) { setResults([]); setSearching(false); return }

        const controller = new AbortController()
        setSearching(true)
        const timer = setTimeout(() => {
            searchAddresses(text, controller.signal)
                .then((r) => { setResults(r); setError('') })
                .catch((e) => { if (e.name !== 'AbortError') setError('We couldn\'t look up addresses right now.') })
                .finally(() => { if (!controller.signal.aborted) setSearching(false) })
        }, 350)

        return () => { clearTimeout(timer); controller.abort() }
    }, [query])

    async function save(values: { county: string | null; state: string | null }) {
        setSaving(true)
        try {
            await updateProfileFields(values)
            onSaved()
            onClose()
        } catch {
            setError('We couldn\'t save this. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    function choose(s: AddressSuggestion) {
        if (!s.county || !s.state) {
            setError('That result is missing a county or state. Try a more complete address, or enter them yourself.')
            return
        }
        save({ county: s.county, state: s.state })
    }

    function saveManual() {
        const problem = validatePlace(county, 'County') || validatePlace(state, 'State')
        if (problem) { setError(problem); return }
        save({ county: county.trim() || null, state: state.trim() || null })
    }

    if (!visible) return null

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Pressable style={surfaces.backdrop} onPress={onClose} accessibilityLabel="Close">
                    <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.title} accessibilityRole="header">Where do you live?</Text>

                        {!manual ? (
                            <>
                                <Text style={type.cardSubtitle}>
                                    Start typing your address and we'll fill in your county and state.
                                </Text>
                                <TextBox
                                    label="Address"
                                    value={query}
                                    onChangeText={(v) => { setQuery(v); setError('') }}
                                    placeholder="123 Main St, Raleigh"
                                    autoFocus
                                    autoCorrect={false}
                                    autoComplete="street-address"
                                    textContentType="fullStreetAddress"
                                />

                                {searching && <ActivityIndicator color={colors.primaryDark} />}

                                {results.length > 0 && (
                                    <View style={styles.results}>
                                        {results.map((s, i) => (
                                            <Pressable
                                                key={s.id}
                                                onPress={() => choose(s)}
                                                disabled={saving}
                                                style={({ pressed }) => [
                                                    styles.result,
                                                    i < results.length - 1 && styles.divider,
                                                    pressed && styles.pressed,
                                                ]}
                                                accessibilityRole="button"
                                                accessibilityLabel={`${s.line1}, ${s.line2}`}
                                            >
                                                <MapPin size={20} color={colors.primaryDark} strokeWidth={2} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.line1}>{s.line1}</Text>
                                                    {s.line2 ? <Text style={styles.line2}>{s.line2}</Text> : null}
                                                    {s.county ? <Text style={styles.fills}>{s.county}, {s.state}</Text> : null}
                                                </View>
                                            </Pressable>
                                        ))}
                                    </View>
                                )}

                                {error ? <Text style={type.error}>{error}</Text> : null}

                                <Pressable onPress={() => { setManual(true); setError('') }} style={styles.link} accessibilityRole="button">
                                    <Text style={type.link}>Can't find it? Enter county and state yourself</Text>
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <TextBox label="County" value={county} onChangeText={(v) => { setCounty(v); setError('') }}
                                    placeholder="Wake County" autoCapitalize="words" maxLength={50} autoFocus />
                                <TextBox label="State" value={state} onChangeText={(v) => { setState(v); setError('') }}
                                    placeholder="North Carolina" autoCapitalize="words" maxLength={50}
                                    autoComplete="address-line2" textContentType="addressState" />
                                {error ? <Text style={type.error}>{error}</Text> : null}

                                <Pressable
                                    onPress={saveManual}
                                    disabled={saving}
                                    style={({ pressed }) => [surfaces.button, (pressed || saving) && { opacity: 0.8 }]}
                                    accessibilityRole="button"
                                >
                                    {saving ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={type.button}>Save</Text>}
                                </Pressable>
                                <Pressable onPress={() => { setManual(false); setError('') }} style={styles.link} accessibilityRole="button">
                                    <Text style={type.link}>Search by address instead</Text>
                                </Pressable>
                            </>
                        )}

                        <Pressable onPress={onClose} style={styles.link} accessibilityRole="button">
                            <Text style={type.link}>Cancel</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    )
}

const styles = StyleSheet.create({
    card: { ...surfaces.modal, gap: space.md },
    title: type.cardTitle,
    results: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden' },
    result: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', padding: space.md, backgroundColor: colors.surface },
    divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    pressed: { backgroundColor: colors.primarySoft },
    line1: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
    line2: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted },
    fills: { fontFamily: fonts.medium, fontSize: 14, color: colors.primaryDark, marginTop: 2 },
    link: { ...surfaces.textButton, alignItems: 'flex-start' },
})