import { Stack } from 'expo-router'
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { Boogaloo_400Regular } from '@expo-google-fonts/boogaloo'
import { colors } from '../constants/theme'

export default function RootLayout() {
    const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Boogaloo_400Regular })

    if (!loaded) return null

    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        {/* Pages going to index.tsx have this animation */}
        <Stack.Screen name="index" options={{animation: 'fade_from_bottom' }}/>

        {/* Pages going to apps/(tabs)/... have this animation */}
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false, animation: 'fade' }} />

        </Stack>
    )
}