import { colors, fonts, space, type, surfaces } from '../constants/theme'
import DateTimePicker from '@react-native-community/datetimepicker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRef, useState, type ComponentRef } from 'react'
import { TextBox } from '../components/TextBox'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import {
    ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable,
    ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'


export default function Signin() {
    const router = useRouter()
    const lastNameRef = useRef<ComponentRef<typeof TextInput>>(null)
    const DOBref = useRef<ComponentRef<typeof TextInput>>(null)


    // const [var, updateFunction()] = useState('initial value')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [DOB, setDOB] = useState<Date>(new Date())
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [nameError, setNameError] = useState('')
    const [DOBerror, setDOBerror] = useState('')
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
                    returnKeyType="next"
                    onSubmitEditing={() => (lastNameRef.current as any)?.focus()}
                    submitBehavior="submit"
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
                    returnKeyType="next"
                    onSubmitEditing={() => (DOBref.current as any)?.focus()}
                    submitBehavior="submit"
                />

                <Pressable onPress={() => setShowDatePicker(true)}>
                    <View pointerEvents="none">
                        <TextBox
                            label="Date of Birth"
                            value={DOB.toISOString().split('T')[0]} // Formats as YYYY-MM-DD
                            onChangeText={() => {}}
                            error={DOBerror}
                            placeholder="YYYY-MM-DD"
                            editable={false}
                        />
                    </View>
                </Pressable>
                {showDatePicker && (
                    <DateTimePicker
                        value={DOB}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        maximumDate={new Date()}
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(Platform.OS === 'ios') // Keep open on iOS until confirmed, close on Android
                            if (selectedDate) setDOB(selectedDate)
                        }}
                    />
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
                    : <Text style={styles.buttonText}>Sign in</Text>}
                </Pressable>

                <Pressable
                onPress={() => { router.replace('/sympathy') }}
                style={styles.switch}
                accessibilityRole="button"
                >
                <Text style={styles.subtext}>Remind me later</Text>
                {/* <Text style={styles.subtext}>First name: {firstName}</Text>
                <Text style={styles.subtext}>Last name: {firstName}</Text> */}
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
})