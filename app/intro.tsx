import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet, Text, View} from 'react-native'
import { TextCard } from '../components/TextCard'
import { space, type } from '../constants/theme'

// to test supabase connection, change /sympathy to /test or /fetchData
export default function Index() {
    return (
        <SafeAreaView style={styles.screen}>
            <View>
                <Text style={type.title}>We're here to help.</Text>
                <Text style={type.body}>Losing someone brings a lot of paperwork. We'll take it one small step at a time. Where are you right now?</Text>
            </View>

            <View style={styles.cards}>
                <TextCard
                    text="My loved one has passed"
                    subtext="We'll show you what to do first, in plain steps."
                    href="/signin"/>
                <TextCard
                    text="I'm preparing for a loss"
                    subtext="Get organized ahead of time and share the load."/>
            </View>

        <View style={styles.bottomText}>
            <Text style={[type.small, { textAlign: 'center'}]}>Free to use. No ads. Take your time.</Text>
        </View>
    </SafeAreaView>
    )
}

export const styles = StyleSheet.create({
    screen: {
        flex: 1,
        padding: space.lg,
        gap: space.lg,
        paddingTop: (space.lg * 2),       // TODO: standardize this to avoid iPhone notch
    },
    cards: {
        flex: 1,
        gap: space.md,
        flexDirection: 'column',
    },
    bottomText:  {
        marginTop: 'auto',                // Pushes this view to the bottom of the flex layout
        padding: 15,
    }
})