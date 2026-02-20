import { Spinner } from '@/components/ui/spinner'

interface LoadingOverlayProps {
  visible: boolean
  message?: string
}

export function LoadingOverlay({ visible, message = 'Processing...' }: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
      data-testid="loading-overlay"
      aria-busy="true"
      aria-label={message}
    >
      <Spinner size="lg" />
      <p className="mt-4 text-sm text-[var(--accent-cyan)] font-light animate-pulse">
        {message}
      </p>
    </div>
  )
}
