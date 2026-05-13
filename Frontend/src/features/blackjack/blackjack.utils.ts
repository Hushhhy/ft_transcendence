import type { BlackjackCard, BlackjackCardSuit } from './types'

export const BLACKJACK_TABLE_ID = 'main'
export const IS_BACKEND_DRIVEN = true

export const chipValues = [5, 10, 25, 50, 100, 500]

export const chipThemes: Record<number, { accent: string; rim: string; glow: string }> = {
    5: { accent: '#D4AF37', rim: '#F7F1DF', glow: 'rgba(212,175,55,0.28)' },
    10: { accent: '#4FC3B3', rim: '#E6FFFA', glow: 'rgba(79,195,179,0.28)' },
    25: { accent: '#D96B7C', rim: '#FFE3E8', glow: 'rgba(217,107,124,0.28)' },
    50: { accent: '#5AA7FF', rim: '#E4F0FF', glow: 'rgba(90,167,255,0.28)' },
    100: { accent: '#67C587', rim: '#E3F9EA', glow: 'rgba(103,197,135,0.28)' },
    500: { accent: '#8E63F5', rim: '#EFE8FF', glow: 'rgba(142,99,245,0.28)' },
}

export const cardSuitSymbols: Record<BlackjackCardSuit, string> = {
    spades: '♠',
    hearts: '♥',
    clubs: '♣',
    diamonds: '♦',
}

export const playerSlots = [
    { pos: 'left-[8%] bottom-[18%]' },
    { pos: 'left-[24%] bottom-[6.5%]' },
    { pos: 'left-1/2 bottom-[2.5%] -translate-x-1/2' },
    { pos: 'right-[24%] bottom-[6.5%]' },
    { pos: 'right-[8%] bottom-[18%]' },
]

export const getCardNumericValue = (rank: string): number => {
    if (rank === 'A') return 11
    if (rank === 'K' || rank === 'Q' || rank === 'J') return 10
    return Number(rank)
}

export const getHandTotal = (cards: BlackjackCard[]): number => {
    let total = 0
    let aceCount = 0

    cards.forEach((card) => {
        total += getCardNumericValue(card.rank)
        if (card.rank === 'A') aceCount += 1
    })

    while (total > 21 && aceCount > 0) {
        total -= 10
        aceCount -= 1
    }

    return total
}

export const getBetBreakdown = (amount: number): number[] => {
    let remaining = amount
    const breakdown: number[] = []

    for (const chip of [...chipValues].sort((a, b) => b - a)) {
        while (remaining >= chip) {
            breakdown.push(chip)
            remaining -= chip
        }
    }

    return breakdown
}

