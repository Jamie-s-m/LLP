import {
  PiPlantDuotone,
  PiFlameDuotone,
  PiLightningDuotone,
  PiCrownDuotone,
  PiDiamondDuotone,
  PiCoinDuotone,
  PiCoinsDuotone,
  PiWalletDuotone,
  PiStarDuotone,
  PiSparkleDuotone,
  PiTrophyDuotone,
  PiMedalDuotone,
} from 'react-icons/pi'
import type { IconType } from 'react-icons'

// Maps the icon KEY backend/src/data/badgeCatalog.js sends (a string, since a JSON API response
// can't carry a React component) to the real Phosphor icon component that renders it. Backend
// and frontend must agree on these key names - PiMedalDuotone is kept as a defensive fallback
// for any badge key that doesn't match (a future catalog entry added without a matching frontend
// update, rather than rendering nothing or crashing).
const BADGE_ICONS: Record<string, IconType> = {
  PiPlantDuotone,
  PiFlameDuotone,
  PiLightningDuotone,
  PiCrownDuotone,
  PiDiamondDuotone,
  PiCoinDuotone,
  PiCoinsDuotone,
  PiWalletDuotone,
  PiStarDuotone,
  PiSparkleDuotone,
  PiTrophyDuotone,
}

export function BadgeIcon({ iconKey, className }: { iconKey: string; className?: string }) {
  const Icon = BADGE_ICONS[iconKey] || PiMedalDuotone
  return <Icon className={className} aria-hidden="true" />
}
