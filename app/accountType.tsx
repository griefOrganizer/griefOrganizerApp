import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { TextCard } from '../components/TextCard'
import { colors, space, type } from '../constants/theme'
import { saveSituation, type Situation } from '../lib/profile'

export default function AccountType() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    async function choose(situation: Situation) {
        if (saving) return
        setSaving(true)
        setError('')
        try {
            await saveSituation(situation)
            router.push(situation === 'loss' ? '/sympathy' : '/takeTime')
        } catch {
            setError('We couldn\'t save your choice. Please try again.')
        } finally {
            setSaving(false)
        }
    }

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
                    onPress={() => choose('loss')}/>
                <TextCard
                    text="I'm preparing for a loss"
                    subtext="Get organized ahead of time and share the load."
                    onPress={() => choose('preparing')}/>
                {error ? <Text style={[type.small, { color: colors.error }]}>{error}</Text> : null}
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
        marginTop: 'auto',
        padding: 15,
    }
})