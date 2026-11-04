import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius, space, type } from '../constants/theme'
import { type LucideIcon } from 'lucide-react-native'
import { useRouter, type Href } from 'expo-router'

type TextCardProps = {
    text: string;
    subtext?: string;                   // no subtext == title text is vertically centered
    href?: Href;
    icon: LucideIcon;
    size: number;
};

export const IconTextCard = ({ text, subtext, href, icon: IconComponent, size }: TextCardProps) => {
    const router = useRouter()
    const hasSubtext = !!subtext       // decides whether to vertically center title text

    return (
        <Pressable
            style={({ pressed }) => [styles.iconTextCard, pressed && { opacity: 0.7 }]}
            onPress={() => href && router.push(href)}
            accessibilityRole="button">
                {IconComponent && <IconComponent size={size} color={colors.text} style={styles.textColumn} />}
                <View style={styles.textColumn}>
                    <Text style={[type.label, !hasSubtext && styles.centered]}>{text}</Text>
                    {hasSubtext && <Text style={type.small}>{subtext}</Text>}
                </View>
        </Pressable>
    )
}

export const styles = StyleSheet.create({
    iconTextCard: {
        backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
        borderRadius: radius.card, padding: 20, gap: space.sm,
        flexDirection: 'row'
    },
    textColumn: {
        flex: 1,
        alignSelf: 'center',            // replaced <justifyContant: 'center',> to vertically center icons
    },
    centered: {
        textAlign: 'left',
    },
})