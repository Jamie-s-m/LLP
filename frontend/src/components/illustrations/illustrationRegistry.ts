// Auto-discovers every SVG under assets/illustrations so adding a new file (per
// frontend/src/assets/illustrations/README.md's sourcing process) never requires touching
// this file - the glob and the on-disk asset list stay in sync by construction.
const modules = import.meta.glob('../../assets/illustrations/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const registry: Record<string, string> = {}
for (const path in modules) {
  const name = path.split('/').pop()!.replace('.svg', '')
  registry[name] = modules[path]
}

export type IllustrationName =
  | 'online-learning'
  | 'journey'
  | 'personal-goals'
  | 'onboarding'
  | 'conversation'
  | 'audio-conversation'
  | 'listening'
  | 'business-chat'
  | 'presentation'
  | 'meeting'
  | 'interview'
  | 'coffee-with-friends'
  | 'around-the-world'
  | 'children'
  | 'book-lover'
  | 'celebration'
  | 'awards'
  | 'certificate'
  | 'growth-chart'
  | 'empty'
  | 'launch-day'

export default registry as Record<IllustrationName, string>
