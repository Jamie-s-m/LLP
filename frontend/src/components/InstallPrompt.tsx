import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferred(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler as EventListener)
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener)
  }, [])

  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    setVisible(false)
    setDeferred(null)
  }

  if (!visible) return null
  return (
    <div className="fixed bottom-20 left-1/2 z-50 w-[92%] -translate-x-1/2 rounded-xl bg-white/95 p-3 shadow-lg dark:bg-[#122b40]/95">
      <div className="flex items-center justify-between">
        <div>
          <strong className="block">Install LinguaNest</strong>
          <div className="text-sm text-muted">Add LinguaNest to your home screen for quick access and offline support.</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={() => { setVisible(false); setDeferred(null) }}>Close</button>
          <button className="btn btn-primary" onClick={install}>Install</button>
        </div>
      </div>
    </div>
  )
}
