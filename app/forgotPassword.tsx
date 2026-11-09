import { useState } from 'react'
import {
    ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable,
    ScrollView, StyleSheet, Text, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { colors, fonts, space, type, surfaces, layout } from '../constants/theme'
import { TextBox } from '../components/TextBox'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
    const router = useRouter()
    const [step, setStep] = useState<'request' | 'verify'>('request')

    // Form inputs
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [newPassword, setNewPassword] = useState('')

    // UI states and validation states
    const [emailError, setEmailError] = useState('')
    const [codeError, setCodeError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [formError, setFormError] = useState('')
    const [loading, setLoading] = useState(false)

    // --- Step 1: Send the OTP code to the user's email --- //
    async function handleSendCode() {
        setEmailError(''); setFormError('')
        if (!email.trim()) { setEmailError('Please enter your email address.'); return }
        if (!email.includes('@')) { setEmailError('Please enter a valid email address.'); return }

        setLoading(true)
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
        setLoading(false)

        if (error) {
            setFormError(error.message)
            return
        }

        // Move to step 2 (verify)
        setStep('verify')
    }

    // --- Steps 2 and 3: Verify the code and set the new password --- //
    async function handleResetPassword() {
        setCodeError(''); setPasswordError(''); setFormError('')

        let valid = true
        if (!code.trim()) { setCodeError('Please enter the 6-digit code.'); valid = false }
        if (!newPassword) { setPasswordError('Please enter a new password.'); valid = false }
        else if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters.'); valid = false }

        if (!valid) return

        setLoading(true)

        // --- Step 2: Verify the OTP token (signs the user in temporarily) --- //
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: code.trim(),
            type: 'recovery',
        })

        if (verifyError) {
            setLoading(false)
            setFormError(verifyError.message)
            return
        }

        // --- Step 3: Save the new password --- //
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
        setLoading(false)

        if (updateError) {
            setFormError(updateError.message)
            return
        }

        // Successful password reset. Go back to root.
        router.replace('/')
    }

    return (
        <SafeAreaView style={styles.screen}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                    <View style={styles.intro}>
                        <Image source={require('../assets/LogoNoBackground.png')} style={styles.logoImage} />
                        <Text style={type.title}>
                            {step === 'request' ? 'Reset password' : 'Enter reset code'}
                        </Text>
                        <Text style={type.body}>
                            {step === 'request'
                                ? "Enter your email address and we'll send you a passcode to reset your password."
                                : `We've sent a code to ${email}. Enter it below along with your new password.`}
                        </Text>
                    </View>

                    {step === 'request' ? (
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
                                returnKeyType="go"
                                onSubmitEditing={handleSendCode}
                            />
                            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
                        </View>
                    ) : (
                        <View style={styles.form}>
                            <TextBox
                                label="Reset Code"
                                value={code}
                                onChangeText={setCode}
                                error={codeError}
                                placeholder="123456"
                                keyboardType="number-pad"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <TextBox
                                label="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                error={passwordError}
                                placeholder="*********"
                                password
                                autoCapitalize="none"
                                autoComplete="new-password"
                                returnKeyType="go"
                                onSubmitEditing={handleResetPassword}
                            />
                            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
                        </View>
                    )}

                    <View style={{ flex: 1 }} />

                    <View style={styles.actions}>
                        <Pressable
                            onPress={step === 'request' ? handleSendCode : handleResetPassword}
                            disabled={loading}
                            style={({ pressed }) => [styles.button, (pressed || loading) && { opacity: 0.7 }]}
                            accessibilityRole="button"
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.surface} />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {step === 'request' ? 'Send Code' : 'Update Password'}
                                </Text>
                            )}
                        </Pressable>

                        <Pressable
                            onPress={() => {
                                if (step === 'verify') {
                                    setStep('request')
                                    setFormError('')
                                } else {
                                    router.replace('/')
                                }
                            }}
                            style={styles.switch}
                            accessibilityRole="button"
                        >
                            <Text style={styles.subtext}>
                                {step === 'verify' ? 'Resend code or change email' : 'Back to sign in'}
                            </Text>
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
    logoImage: layout.logo,
    form: layout.form,
    formError: type.error,
    actions: layout.actions,
    button: surfaces.button,
    buttonText: type.button,
    switch: surfaces.textButton,
    subtext: type.link,
})