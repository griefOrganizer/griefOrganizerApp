import { colors, fonts, space, type, surfaces } from '../constants/theme'
import DateTimePicker from '@react-native-community/datetimepicker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRef, useState, type ComponentRef } from 'react'
import { TextBox } from '../components/TextBox'
import { useRouter } from 'expo-router'
import {
    ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable,
    ScrollView, StyleSheet, Text, TextInput, View, Modal, Button
} from 'react-native'


export default function Signin() {
    const router = useRouter()
    const lastNameRef = useRef<ComponentRef<typeof TextInput>>(null)
    const birthdayRef = useRef<ComponentRef<typeof TextInput>>(null)
    const tempDate = new Date(2000, 0, 1)


    // const [var, updateFunction()] = useState('initial value')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [birthday, setBirthday] = useState<Date | null>(null)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [nameError, setNameError] = useState('')
    const [birthdayError, setBirthdayError] = useState('')
    const [formError, setFormError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        router.replace('/sympathy')
    }

    return (
    <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

            <View style={styles.intro}>
                
                <Image source={require('../assets/LogoNoBackground.png')} style={styles.logoImage} />
                <Text style={type.title}> Account created! </Text>
                <Text style={type.body}>Your account has been created but we're missing some information. This is optional and can be completed later in your profile.</Text>
            </View>

            <View style={styles.form}>
                <TextBox
                    label="First name"
                    value={firstName}
                    onChangeText={setFirstName}
                    error={nameError}
                    placeholder="First name"
                    keyboardType="default"
                    autoCapitalize="words"
                    autoCorrect={false}
                    autoComplete="name"
                    // textContentType="emailAddress"
                    returnKeyType="done"
                    onSubmitEditing={() => (lastNameRef.current as any)?.focus()}
                    submitBehavior="newline"
                />

                <TextBox
                    label="Last name"
                    value={lastName}
                    onChangeText={setLastName}
                    error={nameError}
                    placeholder="Last name"
                    keyboardType="default"
                    autoCapitalize="words"
                    autoCorrect={false}
                    autoComplete="name"
                    // textContentType="emailAddress"
                    returnKeyType="done"
                    onSubmitEditing={() => (birthdayRef.current as any)?.focus()}
                    submitBehavior="newline"
                />

                <Pressable onPress={() => setShowDatePicker(true)}>
                    <View pointerEvents="none">
                        <TextBox
                            label="Date of Birth"
                            // value={birthday ? tempDate.toISOString().split('T')[0] : ''} // formats as YYYY-MM-DD
                            value={birthday ? tempDate.toISOString().split('T')[0] : ''}
                            onChangeText={() => {}}
                            error={birthdayError}
                            placeholder="YYYY-MM-DD"
                            editable={false}
                        />
                    </View>
                </Pressable>
                {showDatePicker && (
                    <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
                        <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
                            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                                <Text style={styles.modalHeader}>Select Date of Birth</Text>
                                
                                <DateTimePicker
                                    textColor={colors.textBody}
                                    accentColor={colors.primary}
                                    value={birthday ?? new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    maximumDate={new Date()}
                                    onValueChange={(event, selectedDate) => {
                                        if (Platform.OS === 'android') {
                                            setShowDatePicker(false)
                                        }
                                        if (selectedDate) setBirthday(selectedDate)
                                    }}
                                />

                                <Pressable
                                    style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.8 }]}
                                    onPress={() => setShowDatePicker(false)}
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
                    : <Text style={styles.buttonText}>Confirm</Text>}
                </Pressable>

                <Pressable
                    onPress={() => { router.replace('/sympathy') }}
                    style={styles.switch}
                    accessibilityRole="button"
                >
                <Text style={styles.subtext}>Remind me later</Text>
                <Text style={styles.subtext}>First name: {firstName}</Text>
                <Text style={styles.subtext}>Last name: {lastName}</Text>
                <Text style={styles.subtext}>birthday: {birthday ? birthday.toLocaleDateString() : 'Not set'}</Text>
                </Pressable>
            </View>

            </ScrollView>
        </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

// don't use button component- can't handle these settings


// holy stylesheet
export const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, paddingHorizontal: space.lg, paddingBottom: space.lg },
    intro: { marginTop: space.lg, gap: space.md },
    logoImage: { width: 120, height: 120, resizeMode: 'contain', alignSelf: 'center'},
    form: { marginTop: space.xl, gap: space.md },
    formError: { ...type.small, color: colors.error },
    actions: { marginTop: space.xl, gap: space.xs },
    button: { ...surfaces.button, height: 60, alignItems: 'center', justifyContent: 'center' },
    buttonText: { fontFamily: fonts.semibold, fontSize: 17, color: colors.surface },
    switch: { height: 44, alignItems: 'center', justifyContent: 'center' },
    subtext: { fontFamily: fonts.medium, fontSize: 16, color: colors.primary },
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    modalContent: { 
        backgroundColor: colors.background, 
        borderRadius: 20, 
        padding: space.lg, 
        width: '88%', 
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    modalHeader: {
        ...type.title,
        fontSize: 18,
        marginBottom: space.sm,
    },
    doneButton: { 
        ...surfaces.button, 
        height: 50, 
        width: '100%', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginTop: space.md,
    },
})