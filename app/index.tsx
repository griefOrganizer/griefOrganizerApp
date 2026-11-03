import { Pressable, StyleSheet, Text, View, Linking, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radius, space, type } from '../constants/theme'
import { Card } from '../components/Card'

export default function Index() {
  return (
      <SafeAreaView style={styles.screen}>
        <View>
          <Text style={type.title}>We're here to help.</Text>
          <Text style={type.body}>Losing someone brings a lot of paperwork. We'll take it one small step at a time. Where are you right now?</Text>
        </View>
        
        <View>
          <Card
            text="My loved one has passed"
            subtext="We'll show you what to do first, in plain steps."
            href="/sympathy"/>
          <Card
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
    screen: { flex: 1, padding: space.lg, gap: space.md },
    card: {
        backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
        borderRadius: radius.card, padding: 20, gap: space.xs,
    },
    bottomText:  {
        marginTop: 'auto', // Pushes this view to the bottom of the flex layout
        padding: 15,
    }
})