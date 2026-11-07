import { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { colors, radius, space, type } from '../../constants/theme'
import { getTasks, type Task, type TaskStatus } from '../../lib/tasks'
import { StatTile } from '../../components/StatTile'
import { ListCard } from '../../components/ListCard'

// One entry per tab: what the tile says, the heading above the list, and the empty message
const TABS: { status: TaskStatus; label: string; heading: string; empty: string }[] = [
  { status: 'ready',   label: 'ready',   heading: 'Ready when you are', empty: 'Nothing to do right now. We\'ll let you know when something\'s ready.' },
  { status: 'waiting', label: 'waiting', heading: 'Waiting on others',  empty: 'Nothing is waiting on anyone else right now.' },
  { status: 'done',    label: 'done',    heading: 'Completed',          empty: 'Tasks you finish will show up here.' },
]

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selected, setSelected] = useState<TaskStatus>('ready')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Reload every time this tab comes into view, so finishing a task updates the counts
  useFocusEffect(
    useCallback(() => {
      let active = true
      getTasks()
        .then((t) => { if (active) { setTasks(t); setError(null) } })
        .catch((e: Error) => { if (active) setError(e.message) })
        .finally(() => { if (active) setLoading(false) })
      return () => { active = false }
    }, [])
  )

  const counts = {
    ready:   tasks.filter((t) => t.status === 'ready').length,
    waiting: tasks.filter((t) => t.status === 'waiting').length,
    done:    tasks.filter((t) => t.status === 'done').length,
  }
  const tab = TABS.find((t) => t.status === selected)!
  const visibleTasks = tasks.filter((t) => t.status === selected)

  return (
    // bottom edge is left out because the tab bar already handles it
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>

      {/* ---------- Frozen header: doesn't scroll ---------- */}
      <View style={styles.header}>
        <View style={styles.intro}>
          <Text style={type.title}>Ease into it</Text>
          <Text style={type.body}>
            {counts.ready} easy {counts.ready === 1 ? 'task' : 'tasks'} ready. Nothing urgent is waiting on you.
          </Text>
        </View>

        <View style={styles.stats} accessibilityRole="tablist">
          {TABS.map((t) => {
            const isSelected = t.status === selected
            return (
              <Pressable
                key={t.status}
                onPress={() => setSelected(t.status)}
                style={({ pressed }) => [
                  styles.tab,
                  isSelected && styles.tabSelected,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${counts[t.status]} ${t.label}`}
              >
                <StatTile value={counts[t.status]} label={t.label} />
              </Pressable>
            )
          })}
        </View>

        <Text style={type.section} accessibilityRole="header">{tab.heading}</Text>
        {error && <Text style={type.body}>Couldn't load tasks: {error}</Text>}
      </View>

      {/* ---------- Only this part scrolls ---------- */}
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={visibleTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListCard title={item.title} subtitle={item.duration} href={item.href} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        ListEmptyComponent={
          loading
            ? <Text style={type.body}>Loading...</Text>
            : !error ? <Text style={type.body}>{tab.empty}</Text> : undefined
        }
        showsVerticalScrollIndicator={true}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
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
  tab: {
    flex: 1,
    flexDirection: 'row',          // THE FIX: lets StatTile's own flex: 1 stretch sideways, not collapse
    borderRadius: radius.card + 2, // hugs the tile's rounded corners
    borderWidth: 2,
    borderColor: 'transparent',    // same size whether selected or not, so nothing shifts
  },
  tabSelected: {
    borderColor: colors.primary,
  },
  list: {
    flex: 1,                       // fills the rest of the screen below the header
  },
  listContent: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
  },
})


{/* <View>
  <FlatList
      data={readyTasks}
      renderItem={({ item }) => <ListCard title={item.title} subtitle={item.duration} href={item.href} />}
      keyExtractor={item => item.id}
  />
</View> */}