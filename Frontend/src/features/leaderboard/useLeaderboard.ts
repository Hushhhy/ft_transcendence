import { useEffect, useState } from 'react'
import api from '../../lib/api'
import type { Player } from './leaderboard.types'
import type { ApiResponse } from '../account/types'

export function useLeaderboard() {
    const [players, setPlayers] = useState<Player[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let isActive = true

        const load = async () => {
            setIsLoading(true)
            setError('')
            try {
                const res = await api.get<ApiResponse<Player[]>>('/leaderboard')
                if (!isActive) return
                if (res.data.status === 'success' && res.data.data) {
                    setPlayers(res.data.data)
                } else {
                    setError(res.data.message || 'Unable to load leaderboard')
                }
            } catch {
                if (isActive) setError('Unable to load leaderboard')
            } finally {
                if (isActive) setIsLoading(false)
            }
        }

        load()
        return () => { isActive = false }
    }, [])

    return { players, isLoading, error }
}
