export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <h1 className="text-3xl font-bold mb-6">Forgot Password</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            Enter your email to receive a password reset link
          </p>
          <form className="space-y-4">
            <input
              type="email"
              className="input"
              placeholder="your@example.com"
              required
            />
            <button type="submit" className="btn btn-primary w-full">
              Send Reset Link
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
