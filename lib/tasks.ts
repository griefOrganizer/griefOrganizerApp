import { type Href } from 'expo-router'
import { Alert } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'; // FileSystem.documentDirectory was deprecated

import { supabase } from './supabase'

export type Task = {
    id: string                       // unique
    title: string
    duration: string
    href?: Href
    status: TaskStatus
}

export type TaskDetail = Task & {
    details: string | null
    link: string | null
    needs: string[]
    steps: string[]
    completedAt: string | null
}

export type TaskStatus = 'ready' | 'waiting' | 'done'

// Fetch number of each type of task
export async function getTaskCounts() {
    const { data, error } = await supabase.from('user_tasks').select('status')
    if (error) throw error
    return {
        ready:   data.filter((t) => t.status === 'ready').length,
        waiting: data.filter((t) => t.status === 'waiting').length,
        done:    data.filter((t) => t.status === 'done').length,
    }
}

// Fetch tasks (all)
export async function getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from('user_tasks')
        .select('id, title, duration, status')
        .order('sort_order')

    if (error) {
        throw new Error(error.message)   // the screen calling this decides how to show it
    }

    return (data ?? []).map((t) => ({ ...t, href: `/task/${t.id}` as Href }))
}

// Obsolete
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

// One task: the user's copy (status) plus the template's content (details, needs, steps)
export async function getTask(id: string): Promise<TaskDetail | null> {
    const { data, error } = await supabase
        .from('user_tasks')
        .select('id, title, duration, status, completed_at, template:task_templates(details, link, needs, steps)')
        .eq('id', id)
        .maybeSingle()

    if (error) throw error
    if (!data) return null

    const t: any = (data as any).template ?? {}
    return {
        id: data.id,
        title: data.title,
        duration: data.duration,
        status: data.status as TaskStatus,
        completedAt: data.completed_at,
        href: `/task/${data.id}` as Href,
        details: t.details ?? null,
        link: t.link ?? null,
        needs: t.needs ?? [],
        steps: t.steps ?? [],
    }
}

export async function setTaskStatus(id: string, status: TaskStatus) {
    const { error } = await supabase
        .from('user_tasks')
        .update({ status, completed_at: status === 'done' ? new Date().toISOString() : null })
        .eq('id', id)
    if (error) throw error
}