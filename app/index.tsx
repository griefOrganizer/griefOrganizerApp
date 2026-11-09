import { useEffect, useRef } from 'react'
import { colors, space, type, surfaces, fonts } from '../constants/theme'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet, Text, View, Image, Animated, Pressable } from 'react-native'
import { Button } from '../components/Button'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { homeRoute } from '../lib/profile'


export default function Opener() {
    const router = useRouter()
    const scaleAnim = useRef(new Animated.Value(0.3)).current // Starts small (0.3x)
    const translateYAnim = useRef(new Animated.Value(0)).current // Starts centered (0px offset)

    useEffect(() => {
        // scale up on page
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
        }).start()
    }, [])

    function handleScreenPress() {
        // on screen tap, suck to the bottom
        Animated.timing(translateYAnim, {
            toValue: 600, // ove down 600px towards the bottom
            duration: 400,
            useNativeDriver: true,
        }).start(async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.replace('/signin')
                return
            }
            router.replace(await homeRoute())
        })
    }

    return (
        <SafeAreaView style={styles.screen}>
            <Pressable style={styles.touchContainer} onPress={handleScreenPress}>
                <Animated.View
                    style={{
                        transform: [
                            { scale: scaleAnim },
                            { translateY: translateYAnim },
                        ],
                    }}
                >
                    {/* to keep image and text centered together */}
                    <Image source={require('../assets/LogoNoBackground.png')} style={styles.logoImage} />
                    <Text style={styles.title}>Let someone else find the next step</Text>
                </Animated.View>
            </Pressable>
        </SafeAreaView>
    )
}

export const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: space.lg,
        paddingBottom: space.lg,
        justifyContent: 'center',
    },
    logoImage: {
        width: 250, 
        height: 250, 
        resizeMode: 'contain', 
        alignSelf: 'center',
        shadowColor: colors.tabInactive,
        shadowRadius: 1,
        shadowOpacity: 100,
        shadowOffset: { // still deciding if i like this shadow or not
            width: -5,
            height: 5,
        }
    },
    button: surfaces.button,
    title: {
        ...type.title,
        color: colors.primaryDark,
        textAlign: 'center',
        // fontFamily: fonts.boogaloo
    },
    touchContainer: {
        flex: 1,
        justifyContent: 'center',
    },
})