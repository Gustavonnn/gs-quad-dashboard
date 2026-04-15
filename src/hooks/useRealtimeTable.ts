import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export interface UseRealtimeTableOptions {
  table: string
  event?: RealtimeEvent
  enabled?: boolean
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
}

export function useRealtimeTable({
  table,
  event = '*',
  enabled = true,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeTableOptions) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const callbackRef = useRef({ onInsert, onUpdate, onDelete })

  // Keep callback refs up to date without re-triggering the effect
  callbackRef.current = { onInsert, onUpdate, onDelete }

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['table', table] })
  }, [queryClient, table])

  useEffect(() => {
    if (!enabled) return

    const channelName = `realtime-${table}-${Date.now()}`

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event, schema: 'public', table },
        (payload) => {
          // Call specific callbacks
          if (payload.eventType === 'INSERT' && callbackRef.current.onInsert) {
            callbackRef.current.onInsert(payload)
          }
          if (payload.eventType === 'UPDATE' && callbackRef.current.onUpdate) {
            callbackRef.current.onUpdate(payload)
          }
          if (payload.eventType === 'DELETE' && callbackRef.current.onDelete) {
            callbackRef.current.onDelete(payload)
          }
          // Always invalidate queries on any change
          invalidate()
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn(`[Realtime] Channel error for table: ${table}`)
        }
      })

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, event, enabled, invalidate])

  return {
    channel: channelRef.current,
  }
}

// ─── Presence tracking ────────────────────────────────────────
export interface PresenceState {
  [key: string]: Array<{ id: string; name: string; online_at: string }>
}

export function usePresence(channelName: string, userId: string, userName: string) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    channelRef.current = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    })

    channelRef.current
      .on('presence', { event: 'sync' }, () => {
        // Presence state updated
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[Presence] join:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[Presence] leave:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channelRef.current?.track({
            id: userId,
            name: userName,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [channelName, userId, userName])

  return { channel: channelRef.current }
}
