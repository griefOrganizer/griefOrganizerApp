import { colors, space, type, surfaces } from '../constants/theme'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet, Text, View} from 'react-native'
import { Button } from '../components/Button'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'expo-router'

export default function Sympathy() {
  const [name, setName] = useState('')
  // const router = useRouter()

  useEffect(() => {
    let active = true

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (active && user) {
        setName(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '')
      }
    }

    void loadUser()
    return () => { active = false }
  }, [])

  return (
    <SafeAreaView style={styles.screen}>

      <View style={styles.intro}>
        <Text style={type.title}>Hello, {name}</Text>
        <Text style={type.body}>
          Your login has been successful. Welcome back.
        </Text>
      </View>

    <Button text="Continue" href="/takeTime" />
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