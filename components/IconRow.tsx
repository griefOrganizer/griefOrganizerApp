
import { colors, space, type } from '../constants/theme'
import { StyleSheet, Text, View } from 'react-native'
import { type LucideIcon } from 'lucide-react-native'

type IconRowProps = {
    icon: LucideIcon
    text: string
    size?: number
}

export const IconRow = ({ icon: IconComponent, text, size = 36 }: IconRowProps) => (
    <View style={styles.row}>
        <IconComponent size={size} color={colors.text} strokeWidth={2} />
        <Text style={[type.body, styles.text]}>{text}</Text>
    </View>
)

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',       // icon is centered against the wrapped text
        gap: space.md,
    },
    text: {
    flex: 1,                        // takes remaining width so long lines wrap
    },
})