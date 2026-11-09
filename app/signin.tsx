import { useRef, useState, type ComponentRef } from 'react'
import {
    ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable,
    ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { colors, fonts, type, surfaces, layout } from '../constants/theme'
import { TextBox } from '../components/TextBox'
import { supabase } from '../lib/supabase'
import { homeRoute } from '../lib/profile'

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

    function clearErrors() {
        if (emailError) setEmailError('')
        if (passwordError) setPasswordError('')
        if (formError) setFormError('')
    }

    function validate() {
        let ok = true
        setEmailError(''); setPasswordError(''); setFormError('')

        if (!email.trim()) { setEmailError('Please enter your email.'); ok = false }
        else if (!email.includes('@')) { setEmailError('That doesn\'t look like an email address...'); ok = false }

        if (!password) { setPasswordError('Please enter your password.'); ok = false }
        else if (isSignUp && password.length < 6) { setPasswordError('Passwords must have at least 6 characters.'); ok = false }

        return ok
    }

    async function handleSubmit() {
        if (!validate() || loading) return
        setLoading(true)

        const credentials = { email: email.trim(), password }
        const { data, error } = isSignUp ? await supabase.auth.signUp(credentials) : await supabase.auth.signInWithPassword(credentials)

        setLoading(false)

        if (error) { setFormError(error.message); return }
        if (!data.session) {
            setFormError('Check your email to confirm your account, then sign in.')
            return
        }

        if (isSignUp) {
            router.replace('/accountType')
            return
        }
        router.replace(await homeRoute())
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
                            onChangeText={(value) => { setEmail(value); clearErrors() }}
                            // Errors are cleared when user types in fields
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
                            onChangeText={(value) => { setPassword(value); clearErrors() }}
                            error={passwordError}
                            placeholder="*********"
                            password
                            autoCapitalize="none"
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                            textContentType={isSignUp ? 'newPassword' : 'password'}
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
                        />
                        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

                        <Text style={styles.switchText} onPress={() => router.replace('/forgotPassword')}>
                            {isSignUp ? '' : 'Forgot password'}
                        </Text>
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
                            onPress={() => { setFormError(''); setMode(isSignUp ? 'signIn' : 'signUp'); clearErrors() }}
                            // Clear errors when user changes mode
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
// export const styles = StyleSheet.create({
//     screen: { flex: 1, backgroundColor: colors.background },
//     content: { flexGrow: 1, paddingHorizontal: space.lg, paddingBottom: space.lg },
//     intro: { marginTop: space.lg, gap: space.md },
//     logoImage: { width: 120, height: 120, resizeMode: 'contain', alignSelf: 'center'},
//     form: { marginTop: space.xl, gap: space.md },
//     formError: { ...type.small, color: colors.error },
//     actions: { marginTop: space.xl, gap: space.xs },
//     button: { ...surfaces.button, height: 60, alignItems: 'center', justifyContent: 'center' },
//     buttonText: { fontFamily: fonts.semibold, fontSize: 17, color: colors.surface },
//     switch: { height: 44, alignItems: 'center', justifyContent: 'center' },
//     switchText: { fontFamily: fonts.medium, fontSize: 16, color: colors.primary },
// })

export const styles = StyleSheet.create({
    screen: layout.screen,
    content: layout.content,
    intro: layout.intro,
    logoImage: layout.logo,
    form: layout.form,
    formError: type.error,
    actions: layout.actions,
    button: surfaces.button,
    buttonText: type.button,
    switch: surfaces.textButton,
    subtext: type.link,
    switchText: { fontFamily: fonts.medium, fontSize: 16, color: colors.primary },
})