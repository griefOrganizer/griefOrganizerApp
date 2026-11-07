import { type Href } from 'expo-router'
import { Alert } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'; // FileSystem.documentDirectory was deprecated

import { supabase } from './supabase'

export type Task = {
    id: string                       // unique
    title: string
    duration: string
    href?: Href                      // add once each task gets its own screen (optional now)
    status: TaskStatus
}
// id and name

export type TaskStatus = 'ready' | 'waiting' | 'done'

export async function getTaskCounts() {
    const { data, error } = await supabase.from('user_tasks').select('status')
    if (error) throw error
    return {
        ready:   data.filter((t) => t.status === 'ready').length,
        waiting: data.filter((t) => t.status === 'waiting').length,
        done:    data.filter((t) => t.status === 'done').length,
    }
}

// --- FETCH TASKS START --- //
export async function getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from('user_tasks')
        .select('id, title, duration, status')
        .order('sort_order')

    if (error) {
        throw new Error(error.message)   // the screen calling this decides how to show it
    }

    return data ?? []
}
// --- FETCH TASKS END --- //

// -- WRITE DATA START --- //
export const writeTasksToFile = async (tasks: Task[]): Promise<string | null> => {
    const fileUri = `${FileSystem.documentDirectory}data.txt`; // define the local path inside the app's document directory
    const contentToWrite = JSON.stringify(tasks, null, 2);

    try {
        // Write the file
        await FileSystem.writeAsStringAsync(fileUri, contentToWrite, {
        encoding: FileSystem.EncodingType.UTF8,
        });
        
        Alert.alert('Success', 'File written successfully!');
        
        // Read it back immediately to verify
        const readData = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
        });
        return readData;                 // caller puts this in state (was setFileContent)
    } catch (error) {
        Alert.alert('Error', `Failed to write file: ${(error as Error).message}`);
        return null;
    }
};
// --- WRITE DATA END --- //