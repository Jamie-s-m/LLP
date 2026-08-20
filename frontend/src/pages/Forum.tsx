import { useEffect, useState } from 'react'
import { FiCornerDownRight, FiPlus } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function Forum() {
  const { isAuthenticated } = useAuthStore()
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
      toast.error(error.response?.data?.message || 'Unable to load forum posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

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
      toast.success('Post published')
      loadPosts()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to publish post')
    }
  }

  const submitReply = async (postId: string) => {
    const reply = (replyDrafts[postId] || '').trim()
    if (!reply) return
    try {
      await api.post(`/forum/posts/${postId}/replies`, { content: reply })
      setReplyDrafts((current) => ({ ...current, [postId]: '' }))
      toast.success('Reply added')
      loadPosts()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to add reply')
    }
  }

  return (
    <div className="atlas-page py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="atlas-heading">
            <p className="atlas-kicker">Community space</p>
            <h1 className="text-4xl font-bold text-ink dark:text-white">Community Forum</h1>
            <p>Share ideas and help each other learn.</p>
          </div>
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowComposer((current) => !current)} disabled={!isAuthenticated}>
            <FiPlus size={20} /> New Post
          </button>
        </div>

        {showComposer ? (
          <form onSubmit={createPost} className="card atlas-panel mb-6 space-y-4">
            <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Post title" required />
            <select className="input" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="discussion">Discussion</option>
              <option value="question">Question</option>
              <option value="resource">Resource</option>
              <option value="event">Event</option>
            </select>
            <textarea className="input min-h-[120px]" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Share your topic..." required />
            <div className="flex gap-3">
              <button className="btn btn-primary" type="submit">Publish Post</button>
              <button className="btn btn-outline" type="button" onClick={() => setShowComposer(false)}>Cancel</button>
            </div>
          </form>
        ) : null}

        {!isAuthenticated ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            Sign in to create posts and replies.
          </div>
        ) : null}

        {/* Posts */}
        <div className="space-y-4">
          {loading ? <div className="card atlas-panel">Loading posts...</div> : posts.map((post) => (
            <div key={post._id} className="card atlas-panel hover:shadow-lg transition-shadow">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold uppercase ${getCategoryColor(post.category)}`}>
                      {post.category}
                    </span>
                    {post.isPinned ? <span className="status-pill">Pinned</span> : null}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-ink">
                    {post.title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-3 whitespace-pre-line">{post.content}</p>
                  <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <span>By {post.author?.firstName} {post.author?.lastName}</span>
                    <span>•</span>
                    <span>{post.viewCount || 0} views</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-center">
                  <div className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-lg p-3">
                    <p className="text-2xl font-bold">{post.replies?.length || 0}</p>
                    <p className="text-xs">Replies</p>
                  </div>
                  <div className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 dark:bg-white/10 dark:text-slate-200">{post.upvotes || 0} likes</div>
                </div>
              </div>
              {post.replies?.length ? (
                <div className="mt-5 space-y-3 border-t border-neutral-200 pt-4">
                  {post.replies.map((reply: any) => (
                    <div key={reply._id} className="rounded-2xl bg-[#f6efe7] p-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">
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
                    placeholder="Write a reply..."
                  />
                  <button className="btn btn-outline" type="button" onClick={() => submitReply(post._id)}>Reply</button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
