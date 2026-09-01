import { useEffect, useId, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FiX } from 'react-icons/fi'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  className?: string
}

// Single Modal implementation for the app - wraps the existing .modal-backdrop/.modal-panel
// CSS (index.css) with the behavior every modal needs: Escape to close, backdrop click to
// close, focus moved into the panel on open and restored to the trigger on close, and a body
// scroll lock while open. Individual call sites previously reimplemented pieces of this
// per-page inconsistently.
export default function Modal({ open, onClose, title, children, className = '' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    document.body.style.overflow = 'hidden'

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            className={`modal-panel outline-none ${className}`}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              {title ? (
                <h2 id={titleId} className="text-lg font-semibold text-[var(--text-primary)] dark:text-[var(--dark-text-primary)]">
                  {title}
                </h2>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--border-light)] hover:text-[var(--text-primary)] dark:text-[var(--dark-text-secondary)] dark:hover:bg-white/10"
              >
                <FiX size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
