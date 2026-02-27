import { useEffect } from 'react'
import { cn } from '../lib/utils'

export interface ToastProps {
  message: string
  action?: { label: string; onClick: () => void }
  onClose: () => void
  duration?: number
}

export function Toast({ message, action, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  return (
    <div
      className={cn(
        'fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50',
        'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-card shadow-lg p-4',
        'flex items-center justify-between gap-3'
      )}
    >
      <span className="text-sm flex-1">{message}</span>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.onClick()
            onClose()
          }}
          className="min-h-touch px-3 rounded-lg font-medium underline shrink-0"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
