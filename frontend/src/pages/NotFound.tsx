import { FiAlertCircle } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <FiAlertCircle className="w-16 h-16 mx-auto mb-6 text-warning" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8">
          Page not found
        </p>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    </div>
  )
}
