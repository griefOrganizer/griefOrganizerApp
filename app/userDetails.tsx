import { colors, fonts, space, type, surfaces, layout } from '../constants/theme'
import DateTimePicker from '@react-native-community/datetimepicker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { TextBox } from '../components/TextBox'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import {
    digitsOnly, formatPhone, toISODate, fromISODate, MIN_BIRTHDAY,
    validateName, validatePhone, validateBirthday,
} from '../lib/validation'
import {
    ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable,
    ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'

const DATE_START = new Date(1970, 0, 1)   // where the picker opens if no date is chosen
const NEXT_SCREEN = '/connectEmail'

export default function UserDetails() {
    const router = useRouter()
    const lastNameRef = useRef<ComponentRef<typeof TextInput>>(null)
    const phoneRef = useRef<ComponentRef<typeof TextInput>>(null)

    const [hasInfo, setHasInfo] = useState(false)
    const [original, setOriginal] = useState({ firstName: '', lastName: '', phone: '', birthday: '' })
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

    // Fill in anything already saved
    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data } = await supabase
                .from('profiles')
                .select('first_name, last_name, phone, date_of_birth')
                .eq('id', user.id)
                .maybeSingle()
            if (!data) return
            setHasInfo(!!(data.first_name || data.last_name || data.phone || data.date_of_birth))
            setFirstName(data.first_name ?? '')
            setLastName(data.last_name ?? '')
            setPhone(data.phone ? formatPhone(data.phone) : '')
            setBirthday(data.date_of_birth ? fromISODate(data.date_of_birth) : null)
            setOriginal({
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

        // Nothing new to save: just move on
        if (!hasChanges) {
            router.push(NEXT_SCREEN)
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
                error.code === '23514'
                    ? 'Some details don\'t look right. Please check them and try again.'
                    : 'We couldn\'t save your details. Please try again.'
            )
            return
        }

        router.push(NEXT_SCREEN)
    }

    function handleRemindLater() {
        if (!hasChanges) {
            router.push(NEXT_SCREEN)
            return
        }
        Alert.alert(
            'Leave without saving?',
            'You\'ve made changes that haven\'t been saved.',
            [
                { text: 'Keep editing', style: 'cancel' },
                { text: 'Leave without saving', style: 'destructive', onPress: () => router.push(NEXT_SCREEN) },
            ]
        )
    }

    return (
        <SafeAreaView style={styles.screen}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                    <View style={styles.intro}>
                        <Image source={require('../assets/LogoNoBackground.png')} style={styles.logoImage} />
                        <Text style={type.title}>A little about you</Text>
                        <Text style={type.body}>
                            {hasInfo
                                ? 'Please check that we have the right information for you.'
                                : 'This is optional. You can add or change it later in your profile.'}
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
                                    onChangeText={(v) => { setLastName(v); setLastNameError('') }}
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
                            onChangeText={(v) => { setPhone(formatPhone(v)); setPhoneError('') }}
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
                                                if (!birthday) setBirthday(DATE_START)
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
                                : <Text style={styles.buttonText}>{hasChanges ? 'Save and continue' : 'Continue'}</Text>}
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
    screen: layout.screen,
    content: layout.content,
    intro: layout.intro,
    row: { flexDirection: 'row', gap: space.sm },
    flex1: { flex: 1 },
    logoImage: layout.logo,
    form: layout.form,
    formError: type.error,
    actions: layout.actions,
    button: surfaces.button,
    buttonText: type.button,
    switch: surfaces.textButton,
    subtext: type.link,
    modalOverlay: surfaces.backdrop,
    modalContent: { ...surfaces.modal, backgroundColor: colors.background, alignItems: 'center' },
    modalHeader: { ...type.label, fontSize: 18, marginBottom: space.sm },
    doneButton: { ...surfaces.button, alignSelf: 'stretch', marginTop: space.md },
    changed: { fontFamily: fonts.semibold, color: colors.primaryDark },
})