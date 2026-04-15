import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'
import { Database } from 'lucide-react'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools
        initialIsOpen={false}
        buttonPosition="bottom-right"
        toggleButtonProps={{
          style: {
            width: '36px',
            height: '36px',
            borderRadius: '4px',
            background: 'rgba(10,10,10,0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            marginBottom: '12px',
            marginRight: '12px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            cursor: 'pointer',
          },
          children: (
            <Database size={16} color="rgba(0,255,102,0.8)" />
          ),
        }}
      />
    </QueryClientProvider>
  )
}
