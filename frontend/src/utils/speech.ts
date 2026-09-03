export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window

export const speak = (text: string, lang = 'en-US') => {
  if (!canSpeak() || !text) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  window.speechSynthesis.speak(utterance)
}
