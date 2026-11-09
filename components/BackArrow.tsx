import { Pressable, StyleSheet } from 'react-native'
import { space, colors } from '../constants/theme'
import { useRouter } from 'expo-router'

import { ChevronLeft } from 'lucide-react-native'

type BackArrowProps = {
    route?: string;
};

export const BackArrow = ({ route }: BackArrowProps) => {
    const router = useRouter()

    // if route prop provided, go that route. otherwise, follow the normal back route
    const goBack = () =>
        route != null
            ? router.replace(route)
            : router.canGoBack()
                ? router.back()
                : router.replace('/')

    return (
        <Pressable
            onPress={goBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.back}
        >
            <ChevronLeft size={32} color={colors.text} />
        </Pressable>
    )
}

export const styles = StyleSheet.create({
    back: {
        alignSelf: 'flex-start',
        marginTop: space.sm,
        marginLeft: -6, // chevron has builtin padding
    },
})