import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--color-gs-surface)',
          border: '1px solid var(--color-gs-border)',
          color: 'var(--color-gs-text)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '12px',
        },
        classNames: {
          success: 'border-l-2 border-l-[var(--color-gs-green)]',
          error: 'border-l-2 border-l-[var(--color-gs-red)]',
          warning: 'border-l-2 border-l-[var(--color-gs-yellow)]',
          info: 'border-l-2 border-l-[var(--color-gs-blue)]',
        },
      }}
    />
  )
}
