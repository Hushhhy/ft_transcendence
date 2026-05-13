export type UserProfile = {
    id: number
    email: string
    username: string
    birthDate: string | null
    avatarUrl: string | null
    verified: boolean
    balance: number
    createdAt: string
    updatedAt: string
}

export type BlackjackRoundCause = 'bust' | 'victory' | 'defeat' | 'blackjack' | 'push'

export type BlackjackRoundHistoryEntry = {
    id: number
    netAmount: number
    cause: BlackjackRoundCause
    createdAt: string
}

export type BlackjackProfileStats = {
    gamesPlayed: number
    totalBalance: number
    bestGainAmount: number
    bestLossAmount: number
    recentRounds: BlackjackRoundHistoryEntry[]
}

export type Friend = {
    id: number
    username: string
    avatarUrl: string | null
    isOnline: boolean
    lastSeen?: string
}

export type FriendshipRequest = {
    id: number
    requester: {
        id: number
        username: string
        avatarUrl: string | null
    }
    addressee: {
        id: number
        username: string
        avatarUrl: string | null
    }
    status: 'pending' | 'accepted' | 'blocked'
    createdAt: string
    updatedAt: string
}

export type ApiResponse<T> = {
    status: 'success' | 'error'
    message: string
    data?: T
}
