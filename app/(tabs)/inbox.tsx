import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, space, type } from '../../constants/theme'

// placeholder for the messages screen
export default function Inbox() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.intro}>
        <Text style={type.title}>Messages</Text>
        <Text style={type.body}>Updates from family and the places you've contacted will show up here.</Text>
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
