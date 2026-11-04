import type { LucideIcon } from 'lucide-react-native'
import { colors } from '../constants/theme'
// import icons from Lucide Icon and set definitions

type Props = { icon: LucideIcon; size?: number; color?: string }

export function Icon({ icon: IconComponent, size = 22, color = colors.primary }: Props) {
  return <IconComponent size={size} color={color} strokeWidth={2} />
}