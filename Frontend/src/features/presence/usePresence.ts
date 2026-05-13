import { useEffect, useState } from 'react'
import api from '../../lib/api'
import type { ApiResponse } from '../account/types'
import { onPresenceUpdate } from './usePresenceSocket'

export type UserPresence = {
    userId: number
    isOnline: boolean
    lastSeen: string | null
}

export function usePresence(userId?: number) {
    const [presence, setPresence] = useState<UserPresence | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        const endpoint = userId ? `/presence/${userId}` : '/presence/me'
        api.get<ApiResponse<UserPresence>>(endpoint)
            .then((res) => {
                if (res.data.status === 'success' && res.data.data) {
                    setPresence(res.data.data)
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [userId])

    useEffect(() => {
        const unsubscribe = onPresenceUpdate((eventUserId, isOnline, lastSeen) => {
            if (presence && eventUserId === presence.userId) {
                setPresence((prev) => prev ? { ...prev, isOnline, lastSeen } : prev)
            }
            if (!userId && presence && eventUserId === presence.userId) {
                setPresence((prev) => prev ? { ...prev, isOnline, lastSeen } : prev)
            }
        })
        return unsubscribe
    }, [userId, presence])

    return { presence, loading }
}
