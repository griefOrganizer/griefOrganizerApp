import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { type Href } from 'expo-router'

import { supabase } from '../lib/supabase'

type Task = {
    id: string                       // unique
    title: string
    duration: string
    href?: Href                      // add once each task gets its own screen (optional now)
}
// id and name

export default function App() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        getTasks()
    }, [])

    async function getTasks() {
        const { data, error } = await supabase.from('ready_tasks').select()

        if (error) {
            setError(error.message)
        return
        }

        setTasks(data ?? [])
    }

    if (error) {
        return (
        <View style={styles.container}>
            <Text>Error loading tasks: {error}</Text>
        </View>
        )
    }

    return (
        // <View style={styles.container}>
        // <FlatList
        //     data={tasks}
        //     keyExtractor={(item) => item.id.toString()}
        //     renderItem={({ item }) => <Text style={styles.item}>{item.name}</Text>}
        // />
        // </View>

        <View style={styles.container}>
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <Text style={styles.item}>{item.title}</Text>}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 50,
        paddingHorizontal: 16,
    },
    item: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
})