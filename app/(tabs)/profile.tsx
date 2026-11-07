import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, space, type } from '../../constants/theme'
import { Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { fonts } from '../../constants/theme'

// placeholder for "Add your own details" screen
export default function Profile() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.intro}>
        <Pressable
          onPress={async () => { await supabase.auth.signOut(); router.replace('/signin') }}
          style={{ height: 44, justifyContent: 'center', marginTop: space.lg }}
          accessibilityRole="button"
          >
          <Text style={{ fontFamily: fonts.medium, fontSize: 16, color: colors.primary }}>Sign out</Text>
        </Pressable>
        <Text style={type.title}>Add your own details</Text>
        <Text style={type.body}>Share details you think are important. Nothing is shared without your say-so.</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: space.lg,
  },
  intro: {
    marginTop: space.lg,
    gap: space.md,
  },
})
