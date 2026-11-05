import { colors, space, type, surfaces, radius } from '../constants/theme'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet, Text, View } from 'react-native'
import { BackArrow } from '../components/BackArrow'
import { Button } from '../components/Button'
import { Clock } from 'lucide-react-native'
import { Icon } from '../components/Icon'
import { useRouter } from 'expo-router'


export default function TakeTime() {
    const router = useRouter()
    const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'))

    return (
        <SafeAreaView style={styles.screen}>
            <BackArrow />

            <View style={styles.intro}>
            <Text style={type.title}>Today, take your time</Text>
            <Text style={type.body}>
                Your first tasks are ready. Nothing urgent is waiting on you.
            </Text>
            </View>

            <View style={styles.middle}>
                <Icon icon={Clock} size={radius.lgIcon} color={colors.text}/>
            </View>

            <View style={styles.bottom}>
                <Button text="See My Task List" href="/tasks"/>
            </View>
        </SafeAreaView>
    )
}

export const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: space.lg,
        paddingBottom: space.lg,
    },
    back: {
        alignSelf: 'flex-start',
        marginTop: space.sm,
        marginLeft: -6, // chevron has builtin padding
    },
    intro: {
        marginTop: space.lg,
        gap: space.md,
    },
    middle: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottom: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    button: surfaces.button,
})