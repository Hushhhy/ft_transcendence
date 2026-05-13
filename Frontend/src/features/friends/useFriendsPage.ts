import { useEffect, useState, useCallback } from 'react'
import api from '../../lib/api'
import type { Friend, FriendshipRequest, ApiResponse } from '../account/types'
import { onPresenceUpdate } from '../presence/usePresenceSocket'

export function useFriendsPage() {
    const [friends, setFriends] = useState<Friend[]>([])
    const [pendingRequests, setPendingRequests] = useState<FriendshipRequest[]>([])
    const [sentRequests, setSentRequests] = useState<FriendshipRequest[]>([])
    const [loading, setLoading] = useState(true)

    const fetchAll = useCallback(() => {
        setLoading(true)
        Promise.all([
            api.get<ApiResponse<Friend[]>>('/friends'),
            api.get<ApiResponse<FriendshipRequest[]>>('/friends/requests/pending'),
            api.get<ApiResponse<FriendshipRequest[]>>('/friends/requests/sent'),
        ])
            .then(([friendsRes, pendingRes, sentRes]) => {
                if (friendsRes.data.status === 'success' && friendsRes.data.data)
                    setFriends(friendsRes.data.data)
                if (pendingRes.data.status === 'success' && pendingRes.data.data)
                    setPendingRequests(pendingRes.data.data)
                if (sentRes.data.status === 'success' && sentRes.data.data)
                    setSentRequests(sentRes.data.data)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        fetchAll()
    }, [fetchAll])

    useEffect(() => {
        const unsubscribe = onPresenceUpdate((userId, isOnline, lastSeen) => {
            setFriends((prev) =>
                prev.map((f) =>
                    f.id === userId
                        ? { ...f, isOnline, lastSeen: lastSeen ?? f.lastSeen }
                        : f
                )
            )
        })
        return unsubscribe
    }, [])

    const removeFriend = (friendId: number) => {
        api.delete('/friends/friend', { data: { friendId } })
            .then(() => setFriends((prev) => prev.filter((f) => f.id !== friendId)))
            .catch(() => {})
    }

    const acceptRequest = (friendshipId: number) => {
        api.patch('/friends/request/respond', { friendshipId, action: 'accept' })
            .then(() => fetchAll())
            .catch(() => {})
    }

    const declineRequest = (friendshipId: number) => {
        api.patch('/friends/request/respond', { friendshipId, action: 'decline' })
            .then(() => setPendingRequests((prev) => prev.filter((r) => r.id !== friendshipId)))
            .catch(() => {})
    }

    return {
        friends,
        pendingRequests,
        sentRequests,
        loading,
        removeFriend,
        acceptRequest,
        declineRequest,
    }
}
