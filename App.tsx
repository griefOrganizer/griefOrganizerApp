import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { supabase } from './lib/supabase'

export default function App() {
  const [status, setStatus] = useState('Checking…')

  useEffect(() => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL
    const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!url || !key) { setStatus('❌ .env keys not loaded'); return }

    fetch(`${url}/auth/v1/health`, { headers: { apikey: key } })
      .then(res => setStatus(res.ok ? '✅ Holy shit. Connected to Supabase!' : `❌ Oops. Error ${res.status}`))
      .catch(err => setStatus(`❌ ${err.message}`))
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F4F1' },
  text: { fontSize: 18 },
})