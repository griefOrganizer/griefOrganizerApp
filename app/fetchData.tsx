import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, View, Alert, Button } from 'react-native'
import { type Href } from 'expo-router'
import * as FileSystem from 'expo-file-system/legacy'; // FileSystem.documentDirectory was deprecated
import { surfaces, type } from '../constants/theme'

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
    const [fileContent, setFileContent] = useState<string>('');

    // --- FETCH TASKS START --- //
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
        return data ?? []
    }

    if (error) {
        return (
        <View style={styles.container}>
            <Text>Error loading tasks: {error}</Text>
        </View>
        )
    }
    // --- FETCH TASKS END --- //

    // -- WRITE DATA START --- //
    const handleWriteFile = async (): Promise<void> => {
    const fileUri = `${FileSystem.documentDirectory}data.txt`; // define the local path inside the app's document directory
    const freshTasks = await getTasks();
    if (!freshTasks) return; // fetch failed, error is already shown
    const contentToWrite = JSON.stringify(freshTasks, null, 2);

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
        setFileContent(readData);
    } catch (error) {
        Alert.alert('Error', `Failed to write file: ${(error as Error).message}`);
    }
    };
    // --- WRITE DATA END --- //

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.container}>
                <View style={styles.button}>
                    <Button color="#FFFFFF" title="Write to File" onPress={handleWriteFile} />
                </View>
                {fileContent ? (
                    <Text style={styles.text}>Saved File Content: {fileContent}</Text>
                ) : null}
            </View>
            <View style={styles.container}>
                <FlatList
                    data={tasks}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <Text style={styles.item}>{item.title}</Text>}
                />
            </View>
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
    text: {
        marginTop: 20,
        fontSize: 16,
        textAlign: 'left'
    },
    button: surfaces.button,
})










    // const handleWriteFile = async (): Promise<void> => {
    // // Define the local path inside the app's document directory
    // const fileUri = `app/data.txt`;
    // const contentToWrite = 'Hello World! This text was written using Expo FileSystem.';

    // try {
    //     // Write the file
    //     await FileSystem.writeAsStringAsync(fileUri, contentToWrite, {
    //     encoding: FileSystem.EncodingType.UTF8,
    //     });
        
    //     Alert.alert('Success', 'File written successfully!');
        
    //     // Read it back immediately to verify
    //     const readData = await FileSystem.readAsStringAsync(fileUri, {
    //     encoding: FileSystem.EncodingType.UTF8,
    //     });
    //     setFileContent(readData);
    // } catch (error) {
    //     Alert.alert('Error', `Failed to write file: ${(error as Error).message}`);
    // }
    // };

    // return (
    // <View style={styles.container}>
    //     <Button title="Write to File" onPress={handleWriteFile} />
    //     {fileContent ? (
    //     <Text>Saved File Content: {fileContent}</Text>
    //     ) : null}
    // </View>
    // );




// export default function App() {
//     const [tasks, setTasks] = useState<Task[]>([])
//     const [error, setError] = useState<string | null>(null)

//     useEffect(() => {
//         getTasks()
//     }, [])

//     async function getTasks() {
//         const { data, error } = await supabase.from('ready_tasks').select()

//         if (error) {
//             setError(error.message)
//         return
//         }

//         setTasks(data ?? [])
//     }

//     if (error) {
//         return (
//         <View style={styles.container}>
//             <Text>Error loading tasks: {error}</Text>
//         </View>
//         )
//     }

//     return (
//         <View style={styles.container}>
//             <FlatList
//                 data={tasks}
//                 keyExtractor={(item) => item.id.toString()}
//                 renderItem={({ item }) => <Text style={styles.item}>{item.title}</Text>}
//             />
//         </View>
//     )
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#fff',
//         paddingTop: 50,
//         paddingHorizontal: 16,
//     },
//     item: {
//         padding: 16,
//         borderBottomWidth: 1,
//         borderBottomColor: '#ccc',
//     },
// })