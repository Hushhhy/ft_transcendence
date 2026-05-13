import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import api from '../../lib/api'
import type { ApiResponse } from './types'

export function useAccountProfile() {
    const { t } = useTranslation()
    const user = useAuthStore((state) => state.user)
    const setUser = useAuthStore((state) => state.setUser)

    const displayedUsername = user?.username ?? 'Guest'

    const [isEditingUsername, setIsEditingUsername] = useState(false)
    const [usernameDraft, setUsernameDraft] = useState(displayedUsername)
    const [avatarMessage, setAvatarMessage] = useState('')
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        setUsernameDraft(displayedUsername)
    }, [displayedUsername])

    const handleStartUsernameEdit = () => {
        setUsernameDraft(displayedUsername)
        setIsEditingUsername(true)
    }

    const handleSaveUsername = async () => {
        if (!user) return
        const nextUsername = usernameDraft.trim()
        if (nextUsername.length < 3) return
        try {
            const res = await api.patch<ApiResponse<{ username: string }>>('/profile', { username: nextUsername })
            if (res.data.status === 'success' && res.data.data) {
                setUser({ ...user, username: res.data.data.username })
                setIsEditingUsername(false)
            }
        } catch {
            //
        }
    }

    const handleUsernameEditAction = () => {
        if (isEditingUsername) {
            handleSaveUsername()
            return
        }
        handleStartUsernameEdit()
    }

    const handleUsernameEditKeyDown = (event: React.KeyboardEvent<HTMLImageElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleUsernameEditAction()
        }
    }

    const handleUsernameInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            handleSaveUsername()
        }
        if (event.key === 'Escape') {
            event.preventDefault()
            setUsernameDraft(displayedUsername)
            setIsEditingUsername(false)
        }
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleAvatarKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleAvatarClick()
        }
    }

    const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) return

        const file = event.target.files?.[0]
        if (!file) return

        setAvatarMessage('')

        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            setAvatarMessage(t('accountAvatarInvalidFormat'))
            event.target.value = ''
            return
        }

        const maxSizeBytes = 2 * 1024 * 1024
        if (file.size > maxSizeBytes) {
            setAvatarMessage(t('accountAvatarTooLarge'))
            event.target.value = ''
            return
        }

        const formData = new FormData()
        formData.append('avatar', file)

        try {
            const res = await api.patch<ApiResponse<{ avatarUrl: string }>>('/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            if (res.data.status === 'success' && res.data.data) {
                setUser({ ...user, avatarUrl: res.data.data.avatarUrl })
            } else {
                setAvatarMessage(t('accountAvatarReadError'))
            }
        } catch {
            setAvatarMessage(t('accountAvatarReadError'))
        }

        event.target.value = ''
    }

    return {
        isEditingUsername,
        usernameDraft,
        setUsernameDraft,
        avatarMessage,
        fileInputRef,
        handleSaveUsername,
        handleUsernameEditAction,
        handleUsernameEditKeyDown,
        handleUsernameInputKeyDown,
        handleAvatarClick,
        handleAvatarKeyDown,
        handleAvatarFileChange,
    }
}
