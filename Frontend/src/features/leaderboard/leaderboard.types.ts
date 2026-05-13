export type Player = {
    id: number
    username: string
    avatarUrl: string | null
    gamesWon: number
}

export type ViewMode = 'global' | 'friends'
