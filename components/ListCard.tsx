import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { ChevronRight, type LucideIcon } from 'lucide-react-native'
import { colors, iconSize, space, surfaces, type } from '../constants/theme'

// Large card with a title, optional subtitle, optional left icon and a chevron.
// Used for tasks ("Notify bank account primary contact / 2 hours"), and reusable for
// "Recently completed" (icon={CircleCheck}, showChevron={false}) and the details screen.
type ListCardProps = {
    title: string
    subtitle?: string
    href?: Href
    icon?: LucideIcon
    showChevron?: boolean
}

export const ListCard = ({ title, subtitle, href, icon: IconComponent, showChevron = true }: ListCardProps) => {
    const router = useRouter()

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && !!href && { opacity: 0.7 }]}
            onPress={() => href && router.push(href)}
            disabled={!href}
            accessibilityRole={href ? 'button' : undefined}
            accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
        >
            {IconComponent && <IconComponent size={iconSize.lg} color={colors.text} strokeWidth={2} />}

            <View style={styles.text}>
                <Text style={type.cardTitle}>{title}</Text>
                {!!subtitle && <Text style={type.cardSubtitle}>{subtitle}</Text>}
            </View>

            {showChevron && <ChevronRight size={32} color={colors.textMuted} strokeWidth={1.5} />}
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        ...surfaces.card,
        paddingHorizontal: space.lg,
        flexDirection: 'row',
        alignItems: 'center',      // icon and chevron centered against the text block
        gap: space.md,
    },
    text: {
        flex: 1,                   // takes remaining width so long titles wrap
        gap: space.xs,
    },
})
