import { useRouter, type Href } from 'expo-router'
import { Pressable, StyleSheet, Text } from 'react-native'
import { colors, radius, space, type } from '../constants/theme'

type CardProps = {
    text: string;
    subtext: string;
    href ? : Href;
};

export const Card = ({ text, subtext, href }: CardProps) => {
    const router = useRouter()

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
            onPress={() => href && router.push(href)}
            accessibilityRole="button" >
                <Text style={type.label}>{text}</Text>
                <Text style={type.small}>{subtext}</Text>
        </Pressable>
    )
}

export const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
        borderRadius: radius.card, padding: 20, gap: space.xs,
    }
})