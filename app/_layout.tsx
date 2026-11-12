import { Stack } from 'expo-router'
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { Boogaloo_400Regular } from '@expo-google-fonts/boogaloo'
import { AutocompleteDropdownContextProvider } from 'react-native-autocomplete-dropdown'
import { colors } from '../constants/theme'

export default function RootLayout() {
    const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Boogaloo_400Regular })

    if (!loaded) return null

    return (
        // needed by the name search on the profile page: the dropdown list is drawn relative to this
        // neded for component
        <AutocompleteDropdownContextProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            {/* pages going to index.tsx have this animation */}
            <Stack.Screen name="index" options={{animation: 'fade_from_bottom' }}/>

            {/* pages going to apps/(tabs)/... have this animation */}
            <Stack.Screen name="(tabs)" options={{ gestureEnabled: false, animation: 'fade' }} />

            </Stack>
        </AutocompleteDropdownContextProvider>
    )
}