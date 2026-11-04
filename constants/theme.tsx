export const colors = {
  // Base
  background: '#F5F4F1',   // warm off-white screen background
  surface: '#FFFFFF',      // cards
  border: '#E3E3E3',       // card outlines

  // Text
  text: '#1F2933',         // titles, card titles
  textBody: '#2B323B',     // paragraph text (darker than muted)
  textMuted: '#5A6270',    // secondary labels ("waiting", "done"), chevrons
  textOnPrimary: '#FFFFFF',

  // Brand blues
  primary: '#7497C9',      // buttons, tab bar, "2 ready" number
  primaryDark: '#2F4A73',  // section headings, icons on soft blue
  primarySoft: '#EAF2FB',  // highlighted stat tile background
  primaryMuted: '#B4C6E0', // avatar tile background
  primaryBorder: '#C9D8EC',// border on highlighted tile

  success: '#2F7A55',
}

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
}

export const type = {
  title: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 40, color: colors.text }, // Screen title: "We're sorry for your loss." / "You're making progress"
  body: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 28, color: colors.textBody }, // Paragraph under the title
  section: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.primaryDark }, // Section heading: "Ready when you are"
  cardTitle: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, color: colors.text }, // Card title: "Notify bank account primary contact"
  cardSubtitle: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 24, color: colors.textBody }, // Card subtitle: "2 hours", "Share bank details"
  stat: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 38, color: colors.text }, // Big stat number: "13"
  statLabel: { fontFamily: fonts.regular, fontSize: 16, color: colors.textMuted }, // Stat label: "waiting"
  button: { fontFamily: fonts.semibold, fontSize: 20, color: colors.textOnPrimary }, // Button text
  label: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
  small: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted }, // "Free to use. No ads"
}

export const space = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 }
export const radius = { card: 20, button: 16, tile: 20, lgIcon: 200}
export const iconSize = { sm: 24, md: 36, lg: 48 }


export const surfaces = {
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: space.lg,
    paddingHorizontal: 20,
  },
  cardHighlighted: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
    borderRadius: radius.card,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 18,
    alignItems: 'center' as const,
  },
}