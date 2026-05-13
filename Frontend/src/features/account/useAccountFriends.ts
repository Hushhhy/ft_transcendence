import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import api from '../../lib/api'
import type { Friend, UserProfile, ApiResponse } from './types'
import { onPresenceUpdate } from '../presence/usePresenceSocket'

export function useAccountFriends() {
    const { t } = useTranslation()
    const user = useAuthStore((state) => state.user)
    const [friendsList, setFriendsList] = useState<Friend[]>([])
    const [friendInput, setFriendInput] = useState('')
    const [friendError, setFriendError] = useState('')
    const [friendSuccess, setFriendSuccess] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        api.get<ApiResponse<Friend[]>>('/friends')
            .then((res) => {
                if (res.data.status === 'success' && res.data.data) {
                    setFriendsList(res.data.data)
                }
            })
            .catch(() => {})
    }, [])

    useEffect(() => {
        const unsubscribe = onPresenceUpdate((userId, isOnline, lastSeen) => {
            setFriendsList((prev) =>
                prev.map((f) =>
                    f.id === userId
                        ? { ...f, isOnline, lastSeen: lastSeen ?? f.lastSeen }
                        : f
                )
            )
        })
        return unsubscribe
    }, [])

    const handleAddFriend = async () => {
        setFriendError('')
        setFriendSuccess('')

        const query = friendInput.trim()
        if (!query) {
            setFriendError(t('friendsInputRequired'))
            return
        }

        if (query.toLowerCase() === user?.username?.toLowerCase()) {
            setFriendError(t('friendsSelfAdd'))
            return
        }

        setIsSubmitting(true)
        try {
            const searchRes = await api.get<ApiResponse<UserProfile[]>>('/profile/search', {
                params: { query, limit: 1 },
            })

            const results = searchRes.data.data ?? []
            const exact = results.find(
                (u) => u.username.toLowerCase() === query.toLowerCase()
            )

            if (!exact) {
                setFriendError(t('friendsNotFound'))
                return
            }

            await api.post('/friends/request', { friendId: exact.id })
            setFriendSuccess(t('friendsRequestSent'))
            setFriendInput('')
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? ''
            if (msg.toLowerCase().includes('already friends')) {
                setFriendError(t('friendsAlreadyFriends'))
            } else if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('pending')) {
                setFriendError(t('friendsRequestAlreadySent'))
            } else if (msg.toLowerCase().includes('blocked')) {
                setFriendError(msg)
            } else if (msg.toLowerCase().includes('not found')) {
                setFriendError(t('friendsNotFound'))
            } else {
                setFriendError(msg || t('friendsNotFound'))
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRemoveFriend = (friendId: number) => {
        api.delete('/friends/friend', { data: { friendId } })
            .then(() => {
                setFriendsList(friendsList.filter((f) => f.id !== friendId))
            })
            .catch(() => {})
    }

    return {
        friendsList,
        friendInput,
        setFriendInput,
        friendError,
        setFriendError,
        friendSuccess,
        isSubmitting,
        handleAddFriend,
        handleRemoveFriend,
    }
}
