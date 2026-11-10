import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { House, Mail, User } from 'lucide-react-native'
import { colors } from '../../constants/theme'

// Every screen inside app/(tabs)/ gets this tab bar.
// Onboarding screens (index, sympathy, takeTime) stay outside this folder, so they don't.
export default function TabLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.primary,
          borderTopWidth: 0,
          // height: 72 + insets.bottom,      // room for the home indicator on newer iPhones
          // paddingTop: 12,
          height: 60 + insets.bottom,      // room for the home indicator on newer iPhones
          paddingTop: 25,
          paddingBottom: insets.bottom,
          // soft shadow above the bar
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          tabBarAccessibilityLabel: 'Your details',
          tabBarIcon: ({ color }) => <User size={45} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          tabBarAccessibilityLabel: 'Tasks',
          tabBarIcon: ({ color }) => <House size={45} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="emailData"
        options={{
          tabBarAccessibilityLabel: 'Messages',
          tabBarIcon: ({ color }) => <Mail size={45} color={color} strokeWidth={1.75} />,
        }}
      />
    </Tabs>
  )
}
