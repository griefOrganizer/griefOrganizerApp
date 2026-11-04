import { colors, space, type, surfaces } from '../constants/theme'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Users, Bookmark, Clock } from 'lucide-react-native'
import { StyleSheet, Text, View} from 'react-native'
import { BackArrow } from '../components/BackArrow'
import { IconRow } from '../components/IconRow'
import { Button } from '../components/Button'
import { useRouter } from 'expo-router'


export default function Sympathy() {
  const router = useRouter()
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'))
  {/* app/index.tsx is the root path so just need to go back one by routing with "/" */}

  return (
    <SafeAreaView style={styles.screen}>
      <BackArrow />

      <View style={styles.intro}>
        <Text style={type.title}>We're sorry for your loss.</Text>
        <Text style={type.body}>
          There's no right way to grieve and there's no deadlines for any of this. When
          you're ready, we'll help with the practical things- one small step at a time.
        </Text>
      </View>

      {/* centers card between intro and button by filling space between the two */}
      <View style={styles.middle}>
        <View style={styles.card}>
          <IconRow icon={Clock} text="Nothing here needs to happen today." />
          <IconRow icon={Bookmark} text="Step away anytime. We'll save your place." />
          <IconRow icon={Users} text="Invite friends and family to share the load when you want help." />
        </View>
      </View>

    <Button text="I'm ready for the next step" href="/takeTime" />
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
  },
  card: {
    ...surfaces.card,
    gap: 20,
  },
  button: surfaces.button,
})