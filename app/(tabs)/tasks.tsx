import { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { setStatusBarStyle } from 'expo-status-bar'
import { colors, radius, space, surfaces, type } from '../../constants/theme'
import { getTasks, type Task, type TaskStatus } from '../../lib/tasks'
import { ListCard } from '../../components/ListCard'

// true  = "Ready when you are" (etc.) scrolls up with the tasks
// false = it stays fixed under the blue band and only the tasks scroll
const HEADING_SCROLLS = true

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
  const insets = useSafeAreaInsets()   // the blue band runs up behind the status bar / notch

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

  // White status bar text while on this screen (it sits on the dark blue band), dark again when leaving
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light')
      return () => setStatusBarStyle('dark')
    }, [])
  )

  const counts = {
    ready:   tasks.filter((t) => t.status === 'ready').length,
    waiting: tasks.filter((t) => t.status === 'waiting').length,
    done:    tasks.filter((t) => t.status === 'done').length,
  }
  const tab = TABS.find((t) => t.status === selected)!
  const visibleTasks = tasks.filter((t) => t.status === selected)

  // "Ready when you are" / "Waiting on others" / "Completed" heading (plus any load error)
  const listHeading = (
    <View style={[styles.listHeader, !HEADING_SCROLLS && styles.listHeaderFixed]}>
      <Text style={type.section} accessibilityRole="header">{tab.heading}</Text>
      {error && <Text style={type.body}>Couldn't load tasks: {error}</Text>}
    </View>
  )

  return (
    // top edge is handled by the blue band, bottom edge by the tab bar
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>

      {/* ---------- Frozen header: doesn't scroll ---------- */}
      <View style={[styles.band, { paddingTop: insets.top + space.md }]}>
        <View style={styles.intro}>
          <Text style={styles.title}>Ease into it</Text>
          <Text style={styles.body}>
            {counts.ready} easy {counts.ready === 1 ? 'task' : 'tasks'} ready. Nothing urgent is waiting on you.
          </Text>
        </View>

        {/* <View style={styles.stats} accessibilityRole="tablist">
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
                <View style={styles.tile}>
                  <Text style={type.stat}>{counts[t.status]}</Text>
                  <Text style={type.statLabel}>{t.label}</Text>
                </View>
              </Pressable>
            )
          })}
        </View> */}

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
                <View style={styles.tile}>
                  <Text style={type.stat}>{counts[t.status]}</Text>
                  <Text style={type.statLabel}>{t.label}</Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* fixed heading: only shown here when HEADING_SCROLLS is false */}
      {!HEADING_SCROLLS && listHeading}

      {/* ---------- Only this part scrolls ---------- */}
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={HEADING_SCROLLS ? listHeading : undefined}
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
  band: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    gap: space.md,
  },
  intro: {
    gap: space.xxs,
  },
  title: {
    ...type.title,
    fontSize: 30,                  // a little smaller than the default title to keep the band short
    lineHeight: 36,
    color: colors.textOnPrimary,
  },
  body: {
    ...type.body,
    lineHeight: 24,
    color: colors.textOnPrimary,
  },
  stats: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.sm,   // tiles slightly pushed in from the cards, like figma
  },
  tab: {
    flex: 1,
    padding: 2,                    // small dark gap between the tile and the selection ring
    borderRadius: radius.card + 4, // fits around the tile's rounded corners
    borderWidth: 2,
    borderColor: 'transparent',    // same size whether selected or not so nothing shifts
  },
  tabSelected: {
    borderColor: colors.primaryMuted,  // light ring that stands out on the dark blue
  },
  tile: {
    ...surfaces.card,
    paddingVertical: space.sm,     // shorter than the old square tiles
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  listHeader: {
    // no side padding here: when it scrolls, listContent already adds it
    paddingTop: space.md,
    paddingBottom: space.sm,
    gap: space.sm,
  },
  listHeaderFixed: {
    paddingHorizontal: space.lg,   // outside the list, so it needs its own side padding
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