import { Pressable, StyleSheet, Text, View, Linking, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radius, space, type } from '../constants/theme'
import { Card } from '../components/Card'
import { useRouter, type Href } from 'expo-router'


export default function Index() {
  const router = useRouter()

  return (
      <SafeAreaView style={styles.screen}>
        <View>
          <Text style={type.title}>We're sorry for your loss.</Text>
          <Text style={type.body}>There's no right way to grieve and there's no deadlines for any of this. When you're ready, we'll help with the practical things- one small step at a time.</Text>
        </View>
        
        <View>
          <Card
            text="Nothing here needs to happen today."
            subtext="*insert clock*"/>
          <Card
            text="Step away anytime. We'll save your place."
            subtext="*insert bookmark*"/>
          <Card
            text="Invite friends and family to share the load when you want help."
            subtext="*insert people*"/>
        </View>

        <View style={styles.bottomText}>
          {/* app/index.tsx is the root path so just need to go back one by routing with "/" */}
          <Text style={[type.label, { textAlign: 'center'}]} onPress={() => router.push("/")}>(press me to go back to index.tsx)</Text>
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