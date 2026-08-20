export interface LiveChatMessage {
  _id: string
  body: string
  createdAt: string
  sender: {
    _id?: string
    firstName: string
    lastName: string
    role?: string
    avatar?: string
  }
  conversation?: string
  readBy?: string[]
}

type ConversationRefreshDetail = {
  conversationId?: string
}

const chatEvents = new EventTarget()

export function emitChatMessage(message: LiveChatMessage) {
  chatEvents.dispatchEvent(new CustomEvent<LiveChatMessage>('message:new', { detail: message }))
}

export function emitConversationRefresh(detail: ConversationRefreshDetail = {}) {
  chatEvents.dispatchEvent(new CustomEvent<ConversationRefreshDetail>('conversation:refresh', { detail }))
}

export function onChatMessage(listener: (message: LiveChatMessage) => void) {
  const handler = (event: Event) => listener((event as CustomEvent<LiveChatMessage>).detail)
  chatEvents.addEventListener('message:new', handler)
  return () => chatEvents.removeEventListener('message:new', handler)
}

export function onConversationRefresh(listener: (detail: ConversationRefreshDetail) => void) {
  const handler = (event: Event) => listener((event as CustomEvent<ConversationRefreshDetail>).detail)
  chatEvents.addEventListener('conversation:refresh', handler)
  return () => chatEvents.removeEventListener('conversation:refresh', handler)
}
