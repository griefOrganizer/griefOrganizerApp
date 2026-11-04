import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { type Href } from 'expo-router'
import { colors, space, type } from '../constants/theme'
import { StatTile } from '../components/StatTile'
import { ListCard } from '../components/ListCard'

type Task = {
  id: string
  title: string
  duration: string
  href?: Href                      // add once each task gets its own screen (optional now)
}

// placeholder data until tasks come from storage or a backend
const READY_TASKS: Task[] = [
  { id: 'bank-contact', title: 'Notify bank account primary contact', duration: '2 hours' },
  { id: 'email', title: 'Close personal email account', duration: '10 minutes' },
  { id: 'streaming', title: 'Cancel streaming subscriptions', duration: '15 minutes' },
]
const WAITING_COUNT = 7
const DONE_COUNT = 13

export default function Tasks() {
  const readyCount = READY_TASKS.length

  return (
    // bottom edge is left out because the tab bar already handles it
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={type.title}>Ease into it</Text>
          <Text style={type.body}>
            {readyCount} easy {readyCount === 1 ? 'task' : 'tasks'} ready. Nothing urgent is waiting on you.
          </Text>
        </View>

        <View style={styles.stats}>
          <StatTile value={readyCount} label="ready" />
          <StatTile value={WAITING_COUNT} label="waiting" />
          <StatTile value={DONE_COUNT} label="done" />
        </View>

        <View style={styles.section}>
          <Text style={type.section} accessibilityRole="header">Ready when you are</Text>

          {readyCount > 0 ? (
            READY_TASKS.map((task) => (
              <ListCard key={task.id} title={task.title} subtitle={task.duration} href={task.href} />
            ))
          ) : (
            <Text style={type.body}>Nothing to do right now. We'll let you know when something's ready.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xl,
    gap: space.lg,
  },
  intro: {
    gap: space.md,
  },
  stats: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.sm,   // tiles slightly pushed in from the cards, like tfigma
  },
  section: {
    gap: space.md,
  },
})
