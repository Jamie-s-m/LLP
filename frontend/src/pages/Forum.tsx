import { useState } from 'react'
import { FiThumbsUp, FiPlus } from 'react-icons/fi'

export default function Forum() {
  const [posts] = useState([
    {
      id: 1,
      title: 'Best way to practice pronunciation?',
      author: 'John Doe',
      excerpt: 'I am struggling with English pronunciation. Does anyone have tips?',
      category: 'question',
      replies: 5,
      upvotes: 12,
      views: 145,
    },
    {
      id: 2,
      title: 'Resources for learning Spanish',
      author: 'Jane Smith',
      excerpt: 'Here are some great resources I found for learning Spanish...',
      category: 'resource',
      replies: 8,
      upvotes: 24,
      views: 312,
    },
    {
      id: 3,
      title: 'Weekly study group meetup',
      author: 'Mike Johnson',
      excerpt: 'Join us for our weekly English conversation practice...',
      category: 'event',
      replies: 3,
      upvotes: 7,
      views: 89,
    },
  ])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      question: 'text-blue-600 dark:text-blue-400',
      resource: 'text-green-600 dark:text-green-400',
      event: 'text-purple-600 dark:text-purple-400',
      discussion: 'text-orange-600 dark:text-orange-400',
    }
    return colors[category] || 'text-neutral-600'
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Community Forum</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Share ideas and help each other learn</p>
          </div>
          <button className="btn btn-primary flex items-center gap-2">
            <FiPlus size={20} /> New Post
          </button>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold uppercase ${getCategoryColor(post.category)}`}>
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 hover:text-primary-500 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-3">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <span>By {post.author}</span>
                    <span>•</span>
                    <span>{post.views} views</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-center">
                  <div className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-lg p-3">
                    <p className="text-2xl font-bold">{post.replies}</p>
                    <p className="text-xs">Replies</p>
                  </div>
                  <button className="flex items-center justify-center gap-1 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                    <FiThumbsUp size={16} />
                    <span className="text-sm font-medium">{post.upvotes}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
