import { useEffect, useState } from 'react'
import { FiCornerDownRight, FiPlus } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useLanguageStore } from '../store/languageStore'

const copy = {
  en: { loadFailed: 'Unable to load forum posts', publishSuccess: 'Post published', publishFailed: 'Unable to publish post', replySuccess: 'Reply added', replyFailed: 'Unable to add reply', kicker: 'Community space', title: 'Community Forum', text: 'Share ideas and help each other learn.', newPost: 'New Post', postTitle: 'Post title', discussion: 'Discussion', question: 'Question', resource: 'Resource', event: 'Event', share: 'Share your topic...', publish: 'Publish Post', cancel: 'Cancel', signIn: 'Sign in to create posts and replies.', loading: 'Loading posts...', by: 'By {name}', views: '{count} views', replies: 'Replies', likes: '{count} likes', pinned: 'Pinned', writeReply: 'Write a reply...', reply: 'Reply' },
  ru: { loadFailed: 'Не удалось загрузить посты форума', publishSuccess: 'Пост опубликован', publishFailed: 'Не удалось опубликовать пост', replySuccess: 'Ответ добавлен', replyFailed: 'Не удалось добавить ответ', kicker: 'Пространство сообщества', title: 'Форум сообщества', text: 'Делитесь идеями и помогайте друг другу учиться.', newPost: 'Новый пост', postTitle: 'Заголовок поста', discussion: 'Обсуждение', question: 'Вопрос', resource: 'Ресурс', event: 'Событие', share: 'Поделитесь темой...', publish: 'Опубликовать пост', cancel: 'Отмена', signIn: 'Войдите, чтобы создавать посты и ответы.', loading: 'Загрузка постов...', by: 'Автор: {name}', views: '{count} просмотров', replies: 'Ответы', likes: '{count} лайков', pinned: 'Закреплено', writeReply: 'Напишите ответ...', reply: 'Ответить' },
  uz: { loadFailed: 'Forum postlarini yuklab bo‘lmadi', publishSuccess: 'Post chop etildi', publishFailed: 'Postni chop etib bo‘lmadi', replySuccess: 'Javob qo‘shildi', replyFailed: 'Javobni qo‘shib bo‘lmadi', kicker: 'Hamjamiyat maydoni', title: 'Hamjamiyat forumi', text: 'G‘oyalarni ulashing va bir-biringizga o‘rganishda yordam bering.', newPost: 'Yangi post', postTitle: 'Post sarlavhasi', discussion: 'Muhokama', question: 'Savol', resource: 'Resurs', event: 'Tadbir', share: 'Mavzuni ulashing...', publish: 'Postni chop etish', cancel: 'Bekor qilish', signIn: 'Post va javob yozish uchun tizimga kiring.', loading: 'Postlar yuklanmoqda...', by: 'Muallif: {name}', views: '{count} ko‘rish', replies: 'Javoblar', likes: '{count} layk', pinned: 'Mahkamlangan', writeReply: 'Javob yozing...', reply: 'Javob berish' },
} as const

export default function Forum() {
  const { isAuthenticated } = useAuthStore()
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('discussion')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})

  const loadPosts = async () => {
    try {
      const response = await api.get('/forum/posts')
      setPosts(response.data.data || [])
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [ui.loadFailed])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      question: 'text-blue-700',
      resource: 'text-green-700',
      event: 'text-purple-700',
      discussion: 'text-orange-700',
    }
    return colors[category] || 'text-neutral-600'
  }

  const createPost = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await api.post('/forum/posts', { title, content, category })
      setTitle('')
      setContent('')
      setCategory('discussion')
      setShowComposer(false)
      toast.success(ui.publishSuccess)
      loadPosts()
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.publishFailed)
    }
  }

  const submitReply = async (postId: string) => {
    const reply = (replyDrafts[postId] || '').trim()
    if (!reply) return
    try {
      await api.post(`/forum/posts/${postId}/replies`, { content: reply })
      setReplyDrafts((current) => ({ ...current, [postId]: '' }))
      toast.success(ui.replySuccess)
      loadPosts()
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.replyFailed)
    }
  }

  return (
    <div className="atlas-page py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="atlas-heading">
            <p className="atlas-kicker">{ui.kicker}</p>
            <h1 className="text-4xl font-bold text-ink dark:text-white">{ui.title}</h1>
            <p>{ui.text}</p>
          </div>
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowComposer((current) => !current)} disabled={!isAuthenticated}>
            <FiPlus size={20} /> {ui.newPost}
          </button>
        </div>

        {showComposer ? (
          <form onSubmit={createPost} className="card atlas-panel mb-6 space-y-4">
            <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={ui.postTitle} required />
            <select className="input" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="discussion">{ui.discussion}</option>
              <option value="question">{ui.question}</option>
              <option value="resource">{ui.resource}</option>
              <option value="event">{ui.event}</option>
            </select>
            <textarea className="input min-h-[120px]" value={content} onChange={(event) => setContent(event.target.value)} placeholder={ui.share} required />
            <div className="flex gap-3">
              <button className="btn btn-primary" type="submit">{ui.publish}</button>
              <button className="btn btn-outline" type="button" onClick={() => setShowComposer(false)}>{ui.cancel}</button>
            </div>
          </form>
        ) : null}

        {!isAuthenticated ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            {ui.signIn}
          </div>
        ) : null}

        {/* Posts */}
        <div className="space-y-4">
          {loading ? <div className="card atlas-panel">{ui.loading}</div> : posts.map((post) => (
            <div key={post._id} className="card atlas-panel hover:shadow-lg transition-shadow">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold uppercase ${getCategoryColor(post.category)}`}>
                      {ui[post.category as 'discussion' | 'question' | 'resource' | 'event'] || post.category}
                    </span>
                    {post.isPinned ? <span className="status-pill">{ui.pinned}</span> : null}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-ink">
                    {post.title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-3 whitespace-pre-line">{post.content}</p>
                  <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <span>{ui.by.replace('{name}', `${post.author?.firstName} ${post.author?.lastName}`)}</span>
                    <span>•</span>
                    <span>{ui.views.replace('{count}', String(post.viewCount || 0))}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-center">
                  <div className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-lg p-3">
                    <p className="text-2xl font-bold">{post.replies?.length || 0}</p>
                    <p className="text-xs">{ui.replies}</p>
                  </div>
                  <div className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 dark:bg-white/10 dark:text-neutral-300">{ui.likes.replace('{count}', String(post.upvotes || 0))}</div>
                </div>
              </div>
              {post.replies?.length ? (
                <div className="mt-5 space-y-3 border-t border-neutral-200 pt-4">
                  {post.replies.map((reply: any) => (
                    <div key={reply._id} className="rounded-2xl bg-[var(--surface-strong)] p-3 text-sm text-muted dark:bg-white/5">
                      <div className="mb-1 flex items-center gap-2 font-semibold text-ink dark:text-white">
                        <FiCornerDownRight size={14} />
                        <span>{reply.author?.firstName} {reply.author?.lastName}</span>
                      </div>
                      <p>{reply.content}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {isAuthenticated ? (
                <div className="mt-4 flex gap-3">
                  <input
                    className="input"
                    value={replyDrafts[post._id] || ''}
                    onChange={(event) => setReplyDrafts((current) => ({ ...current, [post._id]: event.target.value }))}
                    placeholder={ui.writeReply}
                  />
                  <button className="btn btn-outline" type="button" onClick={() => submitReply(post._id)}>{ui.reply}</button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
