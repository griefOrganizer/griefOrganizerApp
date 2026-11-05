import { ScrollView, StyleSheet, Text, View, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, space, type } from '../../constants/theme'
import { getTasks, type Task } from '../../lib/tasks'
import { StatTile } from '../../components/StatTile'
import { ListCard } from '../../components/ListCard'
import { useEffect, useState } from 'react'

const WAITING_COUNT = 7
const DONE_COUNT = 13

export default function Tasks() {
  const [readyTasks, setReadyTasks] = useState<Task[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getTasks()
      .then(setReadyTasks)
      .catch((e: Error) => setError(e.message))
  }, [])

  const readyCount = readyTasks.length

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
          {error && <Text style={type.body}>Couldn't load tasks: {error}</Text>}

          {/* <View>
            <FlatList
                data={readyTasks}
                renderItem={({ item }) => <ListCard title={item.title} subtitle={item.duration} href={item.href} />}
                keyExtractor={item => item.id}
            />
          </View> */}

          {readyCount > 0 ? (
            readyTasks.map((task) => (
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
    paddingHorizontal: space.sm,   // tiles slightly pushed in from the cards, like figma
  },
  section: {
    gap: space.md,
  },
})
