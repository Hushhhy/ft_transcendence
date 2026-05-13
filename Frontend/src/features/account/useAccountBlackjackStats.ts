import { useEffect, useState } from 'react'
import api from '../../lib/api'
import type { ApiResponse, BlackjackProfileStats } from './types'

export function useAccountBlackjackStats() {
    const [stats, setStats] = useState<BlackjackProfileStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let isActive = true

        const loadStats = async () => {
            setIsLoading(true)
            setError('')

            try {
                const response = await api.get<ApiResponse<BlackjackProfileStats>>('/profile/blackjack-stats', {
                    params: { limit: 10 },
                })

                if (!isActive) {
                    return
                }

                if (response.data.status === 'success' && response.data.data) {
                    setStats(response.data.data)
                } else {
                    setError(response.data.message || 'Unable to load blackjack stats')
                }
            } catch {
                if (isActive) {
                    setError('Unable to load blackjack stats')
                }
            } finally {
                if (isActive) {
                    setIsLoading(false)
                }
            }
        }

        loadStats()

        return () => {
            isActive = false
        }
    }, [])

    return {
        stats,
        isLoading,
        error,
    }
}