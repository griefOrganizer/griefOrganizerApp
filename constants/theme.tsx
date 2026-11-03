// colors, radius, space, type

export const colors = {
  background: '#F7F5F2',
  surface: '#FFFFFF',
  text: '#1E2530',
  textMuted: '#4A5361',
  primary: '#3D5C8F',
  primarySoft: '#E3EAF5',
  border: '#D9D6D0',
  success: '#2F7A55',
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
}

export const type = {
  title: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 26, color: colors.textMuted },
  label: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
  small: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted },
}

export const space = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 }
export const radius = { card: 16, button: 14 }