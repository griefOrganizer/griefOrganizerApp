import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useState } from 'react'
import { colors, type, fonts, surfaces, space } from '../constants/theme'

type DetailCardProps = {
    label: string;
    value: string | null;
    sub?: string | null;
}

export const DetailCard = ({ label, value, sub }: DetailCardProps) => {
    const [modalVisible, setModalVisible] = useState(false)

    return (
        <View style={styles.card}>
            <Pressable onPress={() => setModalVisible(true)} accessibilityRole="button">
                <Text style={styles.detailLine}>
                    {label}:{' '}
                    {value
                        ? <Text style={styles.detailValue}>{value}</Text>
                        : <Text style={styles.detailMissing}>Not added</Text>}
                </Text>
            </Pressable>
            {sub ? <Text style={styles.detailSub}>{sub}</Text> : null}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{label}</Text>
                        <Text style={styles.modalValue}>{value || 'Not added'}</Text>
                        {sub ? <Text style={styles.detailSub}>{sub}</Text> : null}
                        <Pressable onPress={() => setModalVisible(false)} accessibilityRole="button">
                            <Text style={styles.modalClose}>Close</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    card: surfaces.card,
    detailLine: { ...type.label, fontSize: 18, lineHeight: 26 },
    detailValue: { color: colors.primaryDark },
    detailMissing: { fontFamily: fonts.regular, color: colors.textMuted },
    detailSub: { ...type.cardSubtitle, marginTop: space.xxs },
    modalBackdrop: surfaces.backdrop,
    modalCard: surfaces.modal,
    modalTitle: type.label,
    modalValue: { ...type.cardTitle, color: colors.primaryDark, marginTop: space.sm },
    modalClose: { ...type.link, marginTop: space.lg, textAlign: 'right' },
})