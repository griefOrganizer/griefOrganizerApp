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
  tabInactive: 'rgba(47, 74, 115, 0.6)', // unselected tab bar icons (faded primaryDark)

  success: '#2F7A55',
  error: '#B3261E',
}

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  boogaloo: 'Boogaloo_400Regular',
}

export const type = {
  title: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 40, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 28, color: colors.textBody },
  section: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.primaryDark },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, color: colors.text },
  cardSubtitle: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 24, color: colors.textBody },
  stat: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 38, color: colors.text },
  statLabel: { fontFamily: fonts.regular, fontSize: 16, color: colors.textMuted },
  label: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
  small: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted },
  heading: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, color: colors.text },
  link: { fontFamily: fonts.medium, fontSize: 16, color: colors.primaryDark },
  error: { fontFamily: fonts.regular, fontSize: 15, color: colors.error },
  button: { fontFamily: fonts.semibold, fontSize: 20, color: colors.textOnPrimary },
}

export const space = { xxs: 4, xs: 6, sm: 10, md: 16, lg: 24, xl: 32 }
export const radius = { card: 20, button: 16, tile: 20, avatar: 18, lgIcon: 200 }
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
    minHeight: 60,                       // stays the same height when spinner replaces text
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  textButton: {                          // text-only buttons, sized to be easy to tap
    minHeight: 44,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  backdrop: {                            // dark overlay behind popups (modals)
    flex: 1,
    justifyContent: 'center' as const,
    padding: space.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {                               // popup card itself (modals)
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
}

export const layout = {
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: space.lg, paddingBottom: space.lg },
  intro: { marginTop: space.lg, gap: space.md },
  form: { marginTop: space.xl, gap: space.md },
  actions: { marginTop: space.xl, gap: space.xs },
  logo: { width: 120, height: 120, resizeMode: 'contain' as const, alignSelf: 'center' as const },
}