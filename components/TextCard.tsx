import { colors, radius, space, type } from '../constants/theme'
import { Pressable, StyleSheet, Text } from 'react-native'
import { useRouter, type Href } from 'expo-router'

type TextCardProps = {
    text: string;
    subtext?: string;
    href?: Href;
    onPress?: () => void
};

export const TextCard = ({ text, subtext, href, onPress }: TextCardProps) => {
    // 'icon: IconComponent' renames the prop
    const router = useRouter()

    return (
        <Pressable
            style={({ pressed }) => [styles.textCard, pressed && { opacity: 0.7 }]}
            onPress={() => (onPress ? onPress() : href && router.push(href))}
            accessibilityRole="button" >
                <Text style={type.label}>{text}</Text>
                <Text style={type.small}>{subtext}</Text>
        </Pressable>
    )
}

export const styles = StyleSheet.create({
    textCard: {
        backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
        borderRadius: radius.card, padding: 20, gap: space.sm,
    },
})