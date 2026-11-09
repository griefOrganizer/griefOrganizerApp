import { StyleSheet, Text, View } from 'react-native'
import { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, space, type } from '../constants/theme'
import { supabase } from '../lib/supabase'

const exampleId = 'task-1'

// Fetch metadata about specific task
export async function fetchTask() {
    const { data, error } = await supabase.from('user_tasks').select('*')

    if (error) throw error

    const task = data?.find((t: { id: string }) => t.id === exampleId)
    return task ? task.id : 'Task not found'
}

export default function Task() {
    const [taskText, setTaskText] = useState('Loading...')

    useEffect(() => {
        fetchTask()
            .then((task) => setTaskText(task))
            .catch(() => setTaskText('Error loading task'))
    }, [])

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
            <View style={styles.intro}>
                <Text style={type.title}>{taskText}</Text>
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
