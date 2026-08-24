export type AppMode = 'demo' | 'staging' | 'production'

export const getAppMode = (): AppMode => {
  const rawMode = String(
    import.meta.env.VITE_APP_MODE ||
      import.meta.env.APP_MODE ||
      import.meta.env.VITE_DEMO_MODE ||
      'production'
  )
    .trim()
    .toLowerCase()

  if (rawMode === 'demo' || rawMode === 'staging' || rawMode === 'production') {
    return rawMode
  }

  if (String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true') {
    return 'demo'
  }

  return 'production'
}

export const isDemoMode = () => getAppMode() === 'demo'
export const isStagingMode = () => getAppMode() === 'staging'
export const isProductionMode = () => getAppMode() === 'production'
export const isDemoFallbackAllowed = () => isDemoMode() || isStagingMode()
