import { useRef, useState, type ComponentRef } from 'react'
import {
    ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable,
    ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { colors, fonts, space, type, surfaces } from '../constants/theme'
import { TextBox } from '../components/TextBox'
import { supabase } from '../lib/supabase'

type Mode = 'signIn' | 'signUp'

export default function Signin() {
    const router = useRouter()
    const passwordRef = useRef<ComponentRef<typeof TextInput>>(null)

    const [mode, setMode] = useState<Mode>('signIn')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [emailError, setEmailError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [formError, setFormError] = useState('')
    const [loading, setLoading] = useState(false)

    const isSignUp = mode === 'signUp'
  // determines if it's signup or signin

    function validate() {
        let ok = true
        setEmailError(''); setPasswordError(''); setFormError('')

        if (!email.trim()) { setEmailError('Please enter your email.'); ok = false }
        else if (!email.includes('@')) { setEmailError('That doesn\'t look like an email address...'); ok = false }

        if (!password) { setPasswordError('Please enter your password.'); ok = false }
        else if (isSignUp && password.length < 6) { setPasswordError('Passwords must have at least 6 characters.'); ok = false }

        return ok
    }
  // SUCCESS!

    async function handleSubmit() {
        if (!validate() || loading) return
        setLoading(true)

        const credentials = { email: email.trim(), password }
        const { data, error } = isSignUp ? await supabase.auth.signUp(credentials) : await supabase.auth.signInWithPassword(credentials)

        setLoading(false)

        if (error) { setFormError(error.message); return }
        if (!data.session) {
            // only happens if "Confirm email" is turned on in Supabase
            // TODO: turn off "Confirm email" in Supabase
            setFormError('Check your email to confirm your account, then sign in.')
            return
        }

        // router.replace('/signInSuccess') // TODO: replace, so Back doesn't return to the sign-in screen
        {isSignUp ? router.replace('/signInSuccess') : router.replace('/newUserDetails')}
    }

    return (
    <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

            <View style={styles.intro}>
                
                <Image source={require('../assets/LogoNoBackground.png')} style={styles.logoImage} />
                <Text style={type.title}> {isSignUp ? 'Create an account' : 'Sign in'} </Text>
                <Text style={type.body}>
                {isSignUp
                    ? 'An account lets us save your progress so you can pick up where you left off.'
                    : 'Sign in so we can save the right details for you.'}
                </Text>
            
            </View>

            <View style={styles.form}>
                <TextBox
                label="Email"
                value={email}
                onChangeText={setEmail}
                error={emailError}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => (passwordRef.current as any)?.focus()}
                submitBehavior="submit"
                />
                
                <TextBox
                ref={passwordRef}
                label="Password"
                value={password}
                onChangeText={setPassword}
                error={passwordError}
                placeholder="*********"
                password
                autoCapitalize="none"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                textContentType={isSignUp ? 'newPassword' : 'password'}
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                />
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
                    : <Text style={styles.buttonText}>{isSignUp ? 'Create account' : 'Sign in'}</Text>}
                </Pressable>

                <Pressable
                onPress={() => { setMode(isSignUp ? 'signIn' : 'signUp'); setFormError('') }}
                style={styles.switch}
                accessibilityRole="button"
                >
                <Text style={styles.switchText}>
                    {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
                </Text>
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
    // TODO: convert to type.body
    switch: { height: 44, alignItems: 'center', justifyContent: 'center' },
    switchText: { fontFamily: fonts.medium, fontSize: 16, color: colors.primary },
})