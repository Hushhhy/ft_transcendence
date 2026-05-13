import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '../../stores/authStore'

// Module-level singleton so other hooks can subscribe to presence events.
let sharedSocket: Socket | null = null
const presenceListeners = new Set<(userId: number, isOnline: boolean, lastSeen: string | null) => void>()

export function onPresenceUpdate(
    cb: (userId: number, isOnline: boolean, lastSeen: string | null) => void
): () => void {
    presenceListeners.add(cb)
    return () => presenceListeners.delete(cb)
}

export function usePresenceSocket() {
    const user = useAuthStore((state) => state.user)
    const socketRef = useRef<Socket | null>(null)

    useEffect(() => {
        if (!user?.token) {
            if (socketRef.current) {
                socketRef.current.disconnect()
                socketRef.current = null
                sharedSocket = null
            }
            return
        }

        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'

        const socket = io(origin, {
            transports: ['websocket', 'polling'],
            auth: { token: user.token },
        })

        socket.on('presence:update', (data: { userId: number; isOnline: boolean; lastSeen: string | null }) => {
            presenceListeners.forEach((cb) => cb(data.userId, data.isOnline, data.lastSeen))
        })

        socketRef.current = socket
        sharedSocket = socket

        return () => {
            socket.disconnect()
            socketRef.current = null
            sharedSocket = null
        }
    }, [user?.token])
}
