import { colors, fonts, space, type, surfaces } from '../constants/theme'
import DateTimePicker from '@react-native-community/datetimepicker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { TextBox } from '../components/TextBox'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import {
    ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable,
    ScrollView, StyleSheet, Text, TextInput, View, Modal, Alert
} from 'react-native'

// ---------- Validation helpers ---------- //
const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/          // letters, spaces, hyphens, apostrophes
const PHONE_PATTERN = /^[2-9]\d{2}[2-9]\d{6}$/          // same rule as the database
const MIN_BIRTHDAY = new Date(1900, 0, 1)
const DATE_START = new Date(1970, 0, 1)                 // where the picker starts on open if no date's chosen

const digitsOnly = (v: string) => v.replace(/\D/g, '')

// 1234567890 -> (123) 456-7890
function formatPhone(v: string) {
    const d = digitsOnly(v).slice(0, 10)
    if (d.length < 4) {
        return d
    }
    if (d.length < 7) {
        return `(${d.slice(0, 3)}) ${d.slice(3)}`
    }

    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

// Use the phone's local date, not UTC, so evening picks don't shift a day
function toISODate(d: Date) {
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const date = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${month}-${date}`
}
function fromISODate(s: string) {
    const [year, month, date] = s.split('-').map(Number)
    return new Date(year, (month - 1), date)
}

function validateName(inputVal: string, label: string) {
    const val = inputVal.trim()
    if (!val) {
        return ''
    }
    if (val.length > 50) {
        return `${label} must be 50 characters or fewer.`
    }
    if (!NAME_PATTERN.test(val)) {
        return `${label} can only use letters, spaces, hyphens and apostrophes.`
    }
    return ''
}

function validatePhone(value: string) {
    const d = digitsOnly(value)
    if (!d) return ''
    if (d.length !== 10) return 'Phone number must be 10 digits.'
    if (!PHONE_PATTERN.test(d)) return 'That doesn\'t look like a valid US phone number.'
    return ''
}

function validateBirthday(date: Date | null) {
    if (!date) {
        return ''
    }
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (date > today) {
        return 'Date of birth can\'t be in the future.'
    }
    if (date < MIN_BIRTHDAY) {
        return 'Please choose a date after 1900.'
    }
    return ''
}

// ---------- Screen ---------- //
export default function Details() {
    const router = useRouter()
    const lastNameRef = useRef<ComponentRef<typeof TextInput>>(null)
    const phoneRef = useRef<ComponentRef<typeof TextInput>>(null)

    const [hasInfo, setHasInfo] = useState(true) // whatever this is set to will show up page load for a split second
    const [original, setOriginal] = useState({ firstName: '', lastName: '', phone: '', birthday: '' }) // values loaded from Supabase to check if fields have been changed
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [birthday, setBirthday] = useState<Date | null>(null)
    const [showDatePicker, setShowDatePicker] = useState(false)

    const [firstNameError, setFirstNameError] = useState('')
    const [lastNameError, setLastNameError] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [birthdayError, setBirthdayError] = useState('')
    const [formError, setFormError] = useState('')
    const [loading, setLoading] = useState(false)

    // fill in information the user already saved (helpful for when this screen is reused in Profile)
    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data } = await supabase
            .from('profiles')
            .select('first_name, last_name, phone, date_of_birth')
            .eq('id', user.id)
            .maybeSingle()
            setHasInfo(!!data)
            if (!data) {
                return
            }
            setFirstName(data.first_name ?? '')
            setLastName(data.last_name ?? '')
            setPhone(data.phone ? formatPhone(data.phone) : '')
            setBirthday(data.date_of_birth ? fromISODate(data.date_of_birth) : null)
            setOriginal({ // used to check if information's been changed later
                firstName: data.first_name ?? '',
                lastName: data.last_name ?? '',
                phone: data.phone ?? '',
                birthday: data.date_of_birth ?? '',
            })
        })()
    }, [])

    const changed = {
        firstName: firstName.trim() !== original.firstName,
        lastName: lastName.trim() !== original.lastName,
        phone: digitsOnly(phone) !== original.phone,
        birthday: (birthday ? toISODate(birthday) : '') !== original.birthday,
    }
    const hasChanges = Object.values(changed).some(Boolean)

    async function handleSubmit() {
        if (loading) return

        const errors = {
            first: validateName(firstName, 'First name'),
            last: validateName(lastName, 'Last name'),
            phone: validatePhone(phone),
            birthday: validateBirthday(birthday),
        }
        setFirstNameError(errors.first)
        setLastNameError(errors.last)
        setPhoneError(errors.phone)
        setBirthdayError(errors.birthday)
        setFormError('')
        if (Object.values(errors).some(Boolean)) return

        const isEmpty = !firstName.trim() && !lastName.trim() && !digitsOnly(phone) && !birthday
        if (isEmpty) {
            setFormError('Please fill in at least one field or tap "Remind me later."')
            return
        }

        setLoading(true)

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            setLoading(false)
            setFormError('Your session has expired. Please sign in again.')
            return
        }

        const { error } = await supabase.from('profiles').upsert({
            id: user.id,
            first_name: firstName.trim() || null,
            last_name: lastName.trim() || null,
            phone: digitsOnly(phone) || null,
            date_of_birth: birthday ? toISODate(birthday) : null,
        })

        setLoading(false)

        if (error) {
            console.warn('Profile save failed:', error)
            setFormError(
            error.code === '23514' // database rule broken
                ? 'Some details don\'t look right. Please check them and try again.'
                : 'We couldn\'t save your details. Please try again.'
            )
            return
        }

        router.replace('/accountType')
        }

        function handleRemindLater() {
            if (!hasChanges) {
                router.replace('/accountType')
                return
            }
            Alert.alert(
                'Leave without saving?',
                'You\'ve made changes that haven\'t been saved.',
                [
                    { text: 'Keep editing', style: 'cancel' },
                    { text: 'Leave without saving', style: 'destructive', onPress: () => router.replace('/accountType') },
                ]
            )
        }

        return (
        <SafeAreaView style={styles.screen}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                <View style={styles.intro}>
                <Image source={require('../assets/LogoNoBackground.png')} style={styles.logoImage} />
                <Text style={type.title}>Welcome!</Text>
                <Text style={type.body}>
                    {hasInfo ? 'Please verify that we have the correct information for you.' : 'We\'re missing some information but this is optional and can be completed later in your profile.'}
                </Text>
                </View>

                <View style={styles.form}>
                <View style={styles.row}>
                    <View style={styles.flex1}>
                    <TextBox
                        label={changed.firstName ? 'First name · edited' : 'First name'}
                        value={firstName}
                        onChangeText={(v) => { setFirstName(v); setFirstNameError('') }}
                        style={changed.firstName ? styles.changed : undefined}
                        error={firstNameError}
                        placeholder="First name"
                        autoCapitalize="words"
                        autoCorrect={false}
                        autoComplete="given-name"
                        textContentType="givenName"
                        maxLength={50}
                        returnKeyType="next"
                        onSubmitEditing={() => lastNameRef.current?.focus()}
                        submitBehavior="submit"
                    />
                    </View>
                    <View style={styles.flex1}>
                    <TextBox
                        ref={lastNameRef}
                        label={changed.lastName ? 'Last name · edited' : 'Last name'}
                        value={lastName}
                        style={changed.lastName ? styles.changed : undefined}
                        error={lastNameError}
                        placeholder="Last name"
                        autoCapitalize="words"
                        autoCorrect={false}
                        autoComplete="family-name"
                        textContentType="familyName"
                        maxLength={50}
                        returnKeyType="next"
                        onSubmitEditing={() => phoneRef.current?.focus()}
                        submitBehavior="submit"
                    />
                    </View>
                </View>

                <TextBox
                    ref={phoneRef}
                    label={changed.phone ? 'Phone number · edited' : 'Phone number'}
                    value={phone}
                    style={changed.phone ? styles.changed : undefined}
                    error={phoneError}
                    placeholder="(313) 555-0123"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    maxLength={14}
                    returnKeyType="done"
                    onSubmitEditing={() => setShowDatePicker(true)}
                />

                <Pressable onPress={() => setShowDatePicker(true)} accessibilityRole="button" accessibilityLabel="Choose date of birth">
                    <View pointerEvents="none">
                    <TextBox
                        label={changed.birthday ? 'Date of birth · edited' : 'Date of birth'}
                        value={birthday ? birthday.toLocaleDateString() : ''}
                        style={changed.birthday ? styles.changed : undefined}
                        error={birthdayError}
                        placeholder="Tap to choose"
                        editable={false}
                    />
                    </View>
                </Pressable>

                {showDatePicker && (
                    <Modal visible transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
                    <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
                        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalHeader}>Select date of birth</Text>

                        <DateTimePicker
                            textColor={colors.textBody}
                            accentColor={colors.primary}
                            value={birthday ?? DATE_START}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            minimumDate={MIN_BIRTHDAY}
                            maximumDate={new Date()}
                            onValueChange={(event, selectedDate) => {
                            if (Platform.OS === 'android') setShowDatePicker(false)
                            if (selectedDate) { setBirthday(selectedDate); setBirthdayError('') }
                            }}
                        />

                        <Pressable
                            style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.8 }]}
                            onPress={() => {
                            if (!birthday) setBirthday(DATE_START) // iOS: keep the date shown if they never scrolled
                            setShowDatePicker(false)
                            }}
                            accessibilityRole="button"
                        >
                            <Text style={styles.buttonText}>Done</Text>
                        </Pressable>
                        </Pressable>
                    </Pressable>
                    </Modal>
                )}

                {formError ? <Text style={styles.formError}>{formError}</Text> : null}
                </View>

                <View style={{ flex: 1 }} />

                <View style={styles.actions}>
                <Pressable
                    onPress={handleSubmit}
                    disabled={loading}
                    style={({ pressed }) => [styles.button, (pressed || loading) && { opacity: 0.7 }]}
                    accessibilityRole="button"
                >
                    {loading
                    ? <ActivityIndicator color={colors.surface} />
                    : <Text style={styles.buttonText}>Save</Text>}
                </Pressable>

                <Pressable onPress={handleRemindLater} style={styles.switch} accessibilityRole="button">
                    <Text style={styles.subtext}>Remind me later</Text>
                </Pressable>
            </View>

            </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, paddingHorizontal: space.lg, paddingBottom: space.lg },
    intro: { marginTop: space.lg, gap: space.md },
    row: { flexDirection: 'row', gap: space.sm },
    flex1: { flex: 1 },
    logoImage: { width: 120, height: 120, resizeMode: 'contain', alignSelf: 'center' },
    form: { marginTop: space.xl, gap: space.md },
    formError: { ...type.small, color: colors.error },
    actions: { marginTop: space.xl, gap: space.xs },
    button: { ...surfaces.button, height: 60, alignItems: 'center', justifyContent: 'center' },
    buttonText: { fontFamily: fonts.semibold, fontSize: 17, color: colors.surface },
    switch: { height: 44, alignItems: 'center', justifyContent: 'center' },
    subtext: { fontFamily: fonts.medium, fontSize: 16, color: colors.primary },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: {
        backgroundColor: colors.background, borderRadius: 20, padding: space.lg, width: '88%', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
    },
    modalHeader: { ...type.title, fontSize: 18, marginBottom: space.sm },
    doneButton: {
        ...surfaces.button, height: 50, width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: space.md,
    },
    changed: { fontFamily: fonts.semibold, color: colors.primaryDark },
})