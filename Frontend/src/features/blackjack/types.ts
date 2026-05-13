export type BlackjackCardSuit = 'spades' | 'hearts' | 'clubs' | 'diamonds'

export type BlackjackCard = {
    id: string
    rank: string
    suit: BlackjackCardSuit
    color: 'red' | 'black'
    faceDown: boolean
}

export type BlackjackBackendCard = {
    rank: string
    suit: BlackjackCardSuit
    value: number
}

export type BlackjackJoinPayload = {
    userId?: number
    nickname?: string
}

export type BlackjackPlaceBetPayload = {
    tableId?: string
    amount: number
}

export type BlackjackActionPayload = {
    tableId?: string
}

export type BlackjackErrorPayload = {
    message: string
}

export type BlackjackPlayerState = {
    userId: number
    username: string
    avatarUrl?: string | null
    seatIndex: number
    bet: number
    hand: BlackjackBackendCard[]
    stood: boolean
    busted: boolean
    blackjack: boolean
    done: boolean
}

export type BlackjackTableStatePayload = {
    tableId: string
    state: 'waiting' | 'betting' | 'playing' | 'settling'
    maxPlayers: number
    roundNumber: number
    dealerHand: BlackjackBackendCard[]
    dealerScore: number
    currentTurnSeatIndex: number | null
    deckRemaining: number
    players: BlackjackPlayerState[]
    pendingPlayers: BlackjackPlayerState[]
    phaseTimerEndsAt?: number | null
    phaseTimerType?: 'waiting' | 'betting' | null
    turnTimerEndsAt?: number | null
}

export type BlackjackRoundResult = {
    seatIndex: number
    userId: number
    username: string
    bet: number
    playerScore: number
    dealerScore: number
    outcome: 'blackjack' | 'win' | 'push' | 'lose' | 'bust'
    payout: number
    playerHand: BlackjackBackendCard[]
    dealerHand: BlackjackBackendCard[]
}

export type BlackjackRoundResultPayload = {
    tableId: string
    roundNumber: number
    dealerHand: BlackjackBackendCard[]
    dealerScore: number
    results: BlackjackRoundResult[]
}

export type BlackjackWalletUpdatePayload = {
    userId: number
    balance: number
    delta: number
    reason: 'bet' | 'payout'
}

export type BlackjackJoinedPendingPayload = {
    tableId: string
    seatIndex: number
    message: string
}
