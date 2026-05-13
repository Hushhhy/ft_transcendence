import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useBlackjackSocket } from './BlackjackSocket'
import type { BlackjackTableStatePayload, BlackjackCard, BlackjackBackendCard, BlackjackRoundResultPayload } from './types'
import type { RoundOutcome } from './RoundResultOverlay'
import {
    BLACKJACK_TABLE_ID,
    chipValues,
} from './blackjack.utils'

function mapBackendCardToUi(card: BlackjackBackendCard, id: string, faceDown = false): BlackjackCard {
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds'

    return {
        id,
        rank: card.rank,
        suit: card.suit,
        color: isRed ? 'red' : 'black',
        faceDown,
    }
}

export function useBlackjackGame() {
    const BETTING_PHASE_DURATION_MS = 10_000
    const TURN_PHASE_DURATION_MS = 10_000
    const SETTLEMENT_DURATION_MS = 4_000
    const MIN_OUTCOME_DISPLAY_MS = 700
    const BLACKJACK_DISPLAY_MS = 3_000
    const BLACKJACK_FADE_DELAY_MS = 1_500
    const IMMEDIATE_BUST_DISPLAY_MS = 1_500
    const DEALER_DRAW_STEP_MS = 750
    const user = useAuthStore((state) => state.user)
    const updateBalance = useAuthStore((state) => state.updateBalance)

    const [showActionButtons, setShowActionButtons] = useState(false)
    const [showChips, setShowChips] = useState(false)
    const [showPlayButton, setShowPlayButton] = useState(true)
    const [isDraggingChip, setIsDraggingChip] = useState(false)
    const [isChipPressed, setIsChipPressed] = useState(false)
    const [currentBet, setCurrentBet] = useState(0)
    const [playError, setPlayError] = useState('')
    
    const [serverTableState, setServerTableState] = useState<BlackjackTableStatePayload | null>(null)
    const [roundResult, setRoundResult] = useState<string>('')
    const [roundOutcome, setRoundOutcome] = useState<RoundOutcome | null>(null)
    const [roundOutcomeDisplayDurationMs, setRoundOutcomeDisplayDurationMs] = useState<number | null>(null)
    const [roundOutcomeFadeDelayMs, setRoundOutcomeFadeDelayMs] = useState<number | null>(null)
    const [walletBalance, setWalletBalance] = useState(user?.balance ?? 0)
    const [isAtTable, setIsAtTable] = useState(false)
    const isAtTableRef = useRef(false)
    const [enteringCardIds, setEnteringCardIds] = useState<string[]>([])
    const [stagedFaceDownIds, setStagedFaceDownIds] = useState<string[]>([])
    const [pendingCardIds, setPendingCardIds] = useState<string[]>([])
    const [dealerCinematicCards, setDealerCinematicCards] = useState<BlackjackCard[] | null>(null)
    const betSubmitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [countdownNowMs, setCountdownNowMs] = useState(Date.now())

    const cardEntryTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
    const dealerCinematicTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
    const animatedCardIdsRef = useRef<Set<string>>(new Set())
    const immediateBustRoundRef = useRef<number | null>(null)

    const pendingCardIdsRef = useRef<Set<string>>(new Set())

    const clearCardEntryTimers = useCallback(() => {
        cardEntryTimeoutsRef.current.forEach((id) => clearTimeout(id))
        cardEntryTimeoutsRef.current = []
        animatedCardIdsRef.current.clear()
        pendingCardIdsRef.current.clear()
        setStagedFaceDownIds([])
        setEnteringCardIds([])
        setPendingCardIds([])
    }, [])

    const clearDealerCinematicTimers = useCallback(() => {
        dealerCinematicTimeoutsRef.current.forEach((id) => clearTimeout(id))
        dealerCinematicTimeoutsRef.current = []
    }, [])

    const clearBetSubmitTimer = useCallback(() => {
        if (betSubmitTimeoutRef.current) {
            clearTimeout(betSubmitTimeoutRef.current)
            betSubmitTimeoutRef.current = null
        }
    }, [])

    useEffect(() => {
        isAtTableRef.current = isAtTable
    }, [isAtTable])

    const triggerCardEntryAnimation = useCallback((cardId: string) => {
        if (animatedCardIdsRef.current.has(cardId)) return
        animatedCardIdsRef.current.add(cardId)
        pendingCardIdsRef.current.delete(cardId)

        setEnteringCardIds((prev) => [...prev, cardId])
        const entryTimeoutId = setTimeout(() => {
            setEnteringCardIds((prev) => prev.filter((id) => id !== cardId))
        }, 30)
        cardEntryTimeoutsRef.current.push(entryTimeoutId)

        setStagedFaceDownIds((prev) => [...prev, cardId])
        const flipTimeoutId = setTimeout(() => {
            setStagedFaceDownIds((prev) => prev.filter((id) => id !== cardId))
        }, 450)
        cardEntryTimeoutsRef.current.push(flipTimeoutId)
    }, [])

    const getDealerFinalRevealDelayMs = useCallback((cardCount: number) => {
        if (cardCount <= 0) {
            return 0
        }

        if (cardCount === 1) {
            return 0
        }

        if (cardCount === 2) {
            return DEALER_DRAW_STEP_MS
        }

        return (cardCount - 1) * DEALER_DRAW_STEP_MS
    }, [DEALER_DRAW_STEP_MS])

    const startDealerCinematic = useCallback((payload: BlackjackRoundResultPayload) => {
        clearDealerCinematicTimers()

        const roundNumber = payload.roundNumber
        const cards = payload.dealerHand ?? []

        if (cards.length === 0) {
            setDealerCinematicCards(null)
            return 0
        }

        const card0 = cards[0]
        const card0Ui = mapBackendCardToUi(
            card0,
            `dealer-${roundNumber}-0-${card0.rank}-${card0.suit}`,
            false,
        )

        if (cards.length < 2) {
            setDealerCinematicCards([card0Ui])
            return getDealerFinalRevealDelayMs(cards.length)
        }

        const card1 = cards[1]
        const isRed1 = card1.suit === 'hearts' || card1.suit === 'diamonds'
        const card1FaceDown: BlackjackCard = {
            id: `dealer-hidden-${roundNumber}`,
            rank: card1.rank,
            suit: card1.suit,
            color: isRed1 ? 'red' : 'black',
            faceDown: true,
        }
        const card1FaceUp: BlackjackCard = { ...card1FaceDown, faceDown: false }

        setDealerCinematicCards([card0Ui, card1FaceDown])

        const flipTid = setTimeout(() => {
            setDealerCinematicCards((prev) =>
                prev ? prev.map((c) => c.id === card1FaceDown.id ? card1FaceUp : c) : prev
            )
        }, DEALER_DRAW_STEP_MS)
        dealerCinematicTimeoutsRef.current.push(flipTid)

        cards.slice(2).forEach((card, index) => {
            const actualIndex = index + 2
            const delay = DEALER_DRAW_STEP_MS * (index + 2)
            const tid = setTimeout(() => {
                const cardUi = mapBackendCardToUi(
                    card,
                    `dealer-${roundNumber}-${actualIndex}-${card.rank}-${card.suit}`,
                    false,
                )
                setDealerCinematicCards((prev) => [...(prev ?? []), cardUi])
                triggerCardEntryAnimation(cardUi.id)
            }, delay)
            dealerCinematicTimeoutsRef.current.push(tid)
        })
        return getDealerFinalRevealDelayMs(cards.length)
    }, [clearDealerCinematicTimers, getDealerFinalRevealDelayMs, triggerCardEntryAnimation, DEALER_DRAW_STEP_MS])

    const {
        connectionStatus,
        lastError: socketError,
        emitJoin,
        emitLeave,
        emitPlaceBet,
        emitHit,
        emitStand,
        emitDouble,
    } = useBlackjackSocket({
        enabled: Boolean(user),
        token: user?.token,
        onTableState: (payload) => {
            if (!isAtTableRef.current) {
                return
            }

            setServerTableState(payload)

            if (payload.state !== 'playing') return

            const me = payload.players.find((p) => p.userId === Number(user?.id))
            const playerHand = me?.hand ?? []
            const dealerHand = payload.dealerHand ?? []

            if (payload.state === 'playing' && me?.busted && immediateBustRoundRef.current !== payload.roundNumber) {
                immediateBustRoundRef.current = payload.roundNumber
                setRoundOutcomeDisplayDurationMs(IMMEDIATE_BUST_DISPLAY_MS)
                setRoundOutcomeFadeDelayMs(0)
                setRoundOutcome('bust')
            }

            const DEAL_STAGGER_MS = 500
            let staggerIndex = 0

            const scheduleCard = (id: string) => {
                if (animatedCardIdsRef.current.has(id) || pendingCardIdsRef.current.has(id)) return
                pendingCardIdsRef.current.add(id)
                const delay = staggerIndex * DEAL_STAGGER_MS
                staggerIndex++
                if (delay === 0) {
                    triggerCardEntryAnimation(id)
                } else {
                    setPendingCardIds((prev) => [...prev, id])
                    const tid = setTimeout(() => {
                        setPendingCardIds((prev) => prev.filter((x) => x !== id))
                        triggerCardEntryAnimation(id)
                    }, delay)
                    cardEntryTimeoutsRef.current.push(tid)
                }
            }

            playerHand.forEach((card, index) => {
                scheduleCard(`seat-${me?.seatIndex}-user-${me?.userId}-round-${payload.roundNumber}-card-${index}-${card.rank}-${card.suit}`)
            })
            if (dealerHand.length >= 1) {
                scheduleCard(`dealer-${payload.roundNumber}-0-${dealerHand[0].rank}-${dealerHand[0].suit}`)
            }
            scheduleCard(`dealer-hidden-${payload.roundNumber}`)
        },
        onRoundResult: (payload) => {
            if (!isAtTableRef.current) {
                return
            }

            const dealerRevealDelayMs = startDealerCinematic(payload)
            const nonBlackjackDisplayDurationMs = Math.max(
                MIN_OUTCOME_DISPLAY_MS,
                SETTLEMENT_DURATION_MS - dealerRevealDelayMs,
            )

            const myResult = payload.results.find((r) => r.userId === Number(user?.id))
            if (myResult) {
                if (myResult.outcome === 'blackjack') {
                    setRoundOutcomeDisplayDurationMs(BLACKJACK_DISPLAY_MS)
                    setRoundOutcomeFadeDelayMs(BLACKJACK_FADE_DELAY_MS)
                    setRoundOutcome('blackjack')
                }
                else if (myResult.outcome === 'win' || myResult.outcome === 'lose' || myResult.outcome === 'bust' || myResult.outcome === 'push') {
                    if (myResult.outcome === 'bust' && immediateBustRoundRef.current === payload.roundNumber) {
                        return
                    }

                    const tid = setTimeout(() => {
                        setRoundOutcomeDisplayDurationMs(nonBlackjackDisplayDurationMs)
                        setRoundOutcomeFadeDelayMs(0)
                        setRoundOutcome(myResult.outcome)
                    }, dealerRevealDelayMs)
                    dealerCinematicTimeoutsRef.current.push(tid)
                }
            }
        },
        onWalletUpdate: (payload) => {
            setWalletBalance(payload.balance)
            if (payload.userId === Number(user?.id)) {
                updateBalance(payload.balance)
            }
        },
        onError: (payload) => {
            if (payload.message) setPlayError(payload.message)
        },
    })

    useEffect(() => {
        return () => {
            emitLeave({ tableId: BLACKJACK_TABLE_ID })
            clearCardEntryTimers()
            clearBetSubmitTimer()
            clearDealerCinematicTimers()
        }
    }, [emitLeave, clearCardEntryTimers, clearBetSubmitTimer, clearDealerCinematicTimers])

    useEffect(() => {
        setWalletBalance(user?.balance ?? 0)
    }, [user?.balance])

    useEffect(() => {
        if (serverTableState?.state === 'betting') {
            setDealerCinematicCards(null)
            clearDealerCinematicTimers()
            clearCardEntryTimers()
            setPlayError('')
            setRoundOutcome(null)
            setRoundOutcomeDisplayDurationMs(null)
            setRoundOutcomeFadeDelayMs(null)
            immediateBustRoundRef.current = null
        }
    }, [serverTableState?.state, clearDealerCinematicTimers, clearCardEntryTimers])

    useEffect(() => {
        const isBetting = serverTableState?.state === 'betting'
        const endsAt = serverTableState?.phaseTimerEndsAt ?? null
        const isPlaying = serverTableState?.state === 'playing'
        const turnEndsAt = serverTableState?.turnTimerEndsAt ?? null
        const hasActiveCountdown = (isBetting && !!endsAt) || (isPlaying && !!turnEndsAt)

        if (!hasActiveCountdown) {
            return
        }

        setCountdownNowMs(Date.now())
        const intervalId = setInterval(() => {
            setCountdownNowMs(Date.now())
        }, 100)

        return () => clearInterval(intervalId)
    }, [serverTableState?.state, serverTableState?.phaseTimerEndsAt, serverTableState?.turnTimerEndsAt])

    const isGameRunning = serverTableState?.state === 'playing' || serverTableState?.state === 'settling'
    const currentPlayer = serverTableState?.players.find((p) => p.userId === Number(user?.id))
    const currentPlayerName = currentPlayer?.username || user?.username || '-'
    const isMyTurn = Boolean(
        serverTableState
        && currentPlayer
        && serverTableState.currentTurnSeatIndex === currentPlayer.seatIndex
    )
    const currentPlayerAvatarUrl = currentPlayer?.avatarUrl || user?.avatarUrl || '/profile.svg'
    const currentPlayerSeatIndex = currentPlayer?.seatIndex ?? null

    const handlePlayClick = () => {
        if (!user) {
            setPlayError('Veuillez vous connecter pour lancer une partie.')
            return
        }

        if (connectionStatus !== 'connected') {
            setPlayError('Connexion blackjack indisponible. Réessayez dans un instant.')
            return
        }

        const balance = walletBalance
        if (balance < 5) {
            setPlayError('Solde insuffisant: minimum 5 EUR pour lancer la partie.')
            return
        }
        
        setPlayError('')
        const didEmitJoin = emitJoin({ userId: user.id, nickname: user.username })
        if (!didEmitJoin) {
            setIsAtTable(false)
            setPlayError('Impossible de rejoindre la table pour le moment.')
            return
        }

        setIsAtTable(true)

        setShowActionButtons(true)
        setShowChips(true)
        setShowPlayButton(false)
    }

    const handleHitClick = () => {
        if (!isGameRunning || !isMyTurn) return
        emitHit({ tableId: BLACKJACK_TABLE_ID })
    }

    const handleStandClick = () => {
        if (!isGameRunning || !isMyTurn) return
        emitStand({ tableId: BLACKJACK_TABLE_ID })
    }

    const handleDoubleClick = () => {
        if (!isGameRunning || !isMyTurn) return
        emitDouble({ tableId: BLACKJACK_TABLE_ID })
    }

    const handleLeaveTable = useCallback(() => {
        emitLeave({ tableId: BLACKJACK_TABLE_ID })
        setIsAtTable(false)
        clearBetSubmitTimer()
        clearCardEntryTimers()
        clearDealerCinematicTimers()
        setServerTableState(null)
        setDealerCinematicCards(null)
        setCurrentBet(0)
        setEnteringCardIds([])
        setStagedFaceDownIds([])
        setPendingCardIds([])
        setRoundResult('')
        setRoundOutcome(null)
        setRoundOutcomeDisplayDurationMs(null)
        setRoundOutcomeFadeDelayMs(null)
        setPlayError('')
        setShowActionButtons(false)
        setShowChips(false)
        setShowPlayButton(true)
    }, [emitLeave, clearBetSubmitTimer, clearCardEntryTimers, clearDealerCinematicTimers])

    const handleReset = useCallback(() => {
        clearBetSubmitTimer()
        clearCardEntryTimers()
        setCurrentBet(0)
        setRoundResult('')
        setRoundOutcome(null)
        setRoundOutcomeDisplayDurationMs(null)
        setRoundOutcomeFadeDelayMs(null)
        setPlayError('')
        setEnteringCardIds([])
        setStagedFaceDownIds([])

        if (serverTableState?.state === 'betting' && currentBet > 0) {
            emitPlaceBet({ amount: 0 })
        }
    }, [clearCardEntryTimers, clearBetSubmitTimer, emitPlaceBet, serverTableState?.state, currentBet])

    const closeAnimationOverlay = useCallback(() => {
        setRoundOutcome(null)
        setRoundOutcomeDisplayDurationMs(null)
        setRoundOutcomeFadeDelayMs(null)
    }, [])

    const handleChipDragStart = (chipValue: number) => (event: React.DragEvent<HTMLButtonElement>) => {
        setIsDraggingChip(true)
        setIsChipPressed(true)
        event.dataTransfer.setData('text/plain', String(chipValue))
        event.dataTransfer.effectAllowed = 'copy'
    }

    const handleChipDragEnd = () => {
        setIsDraggingChip(false)
        setIsChipPressed(false)
    }

    const handleChipPointerDown = () => { setIsChipPressed(true) }
    const handleChipPointerUp = () => { setIsChipPressed(false) }

    const handleBetDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
    }

    const handleBetDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()

        if (serverTableState?.state !== 'betting') {
            return
        }

        const chipValue = Number(event.dataTransfer.getData('text/plain'))
        if (!chipValues.includes(chipValue)) return

        setCurrentBet((prev) => {
            const nextBet = prev + chipValue

            clearBetSubmitTimer()
            betSubmitTimeoutRef.current = setTimeout(() => {
                emitPlaceBet({ amount: nextBet })
            }, 250)

            return nextBet
        })
    }

    const handleChipClick = useCallback((chipValue: number) => {
        if (serverTableState?.state !== 'betting') return
        if (!chipValues.includes(chipValue)) return

        setCurrentBet((prev) => {
            const nextBet = prev + chipValue

            clearBetSubmitTimer()
            betSubmitTimeoutRef.current = setTimeout(() => {
                emitPlaceBet({ amount: nextBet })
            }, 250)

            return nextBet
        })
    }, [serverTableState?.state, clearBetSubmitTimer, emitPlaceBet])

    useEffect(() => {
        if (!serverTableState) {
            return
        }

        if (serverTableState.state === 'waiting') {
            setCurrentBet(0)
            clearBetSubmitTimer()
            return
        }

        const mySeat = serverTableState.players.find((p) => p.userId === Number(user?.id))

        setCurrentBet(mySeat?.bet ?? 0)

        if (!mySeat?.bet || mySeat.bet <= 0) {
            clearBetSubmitTimer()
            return
        }

        clearBetSubmitTimer()
    }, [serverTableState, user?.id, clearBetSubmitTimer])

    const dealerCardsFromServer = serverTableState?.dealerHand ?? []
    const dealerCardsFromTableState = dealerCardsFromServer.map((card, index) =>
        mapBackendCardToUi(card, `dealer-${serverTableState?.roundNumber ?? 0}-${index}-${card.rank}-${card.suit}`, false)
    )

    const dealerCards = dealerCinematicCards ?? dealerCardsFromTableState

    if (serverTableState?.state === 'playing' && dealerCards.length === 1 && !dealerCinematicCards) {
        dealerCards.push({
            id: `dealer-hidden-${serverTableState.roundNumber}`,
            rank: 'A',
            suit: 'spades',
            color: 'black',
            faceDown: true,
        })
    }

    const playerCards = (currentPlayer?.hand ?? []).map((card, index) =>
        mapBackendCardToUi(card, `player-${currentPlayer?.userId ?? 'na'}-${serverTableState?.roundNumber ?? 0}-${index}-${card.rank}-${card.suit}`, false)
    )
    const drawPile: BlackjackCard[] = []

    const isBettingPhase = serverTableState?.state === 'betting'
    const bettingPhaseEndsAt = serverTableState?.phaseTimerEndsAt ?? null
    const bettingTimeLeftMs = isBettingPhase && bettingPhaseEndsAt
        ? Math.max(0, bettingPhaseEndsAt - countdownNowMs)
        : 0
    const bettingProgressPercent = Math.max(0, Math.min(100, (bettingTimeLeftMs / BETTING_PHASE_DURATION_MS) * 100))

    let bettingBarColor = '#2ECC71'
    if (bettingTimeLeftMs <= 3_000) {
        bettingBarColor = '#E74C3C'
    } else if (bettingTimeLeftMs <= 6_000) {
        bettingBarColor = '#F39C12'
    }

    const turnPhaseEndsAt = serverTableState?.turnTimerEndsAt ?? null
    const turnTimeLeftMs = serverTableState?.state === 'playing' && isMyTurn && turnPhaseEndsAt
        ? Math.max(0, turnPhaseEndsAt - countdownNowMs)
        : 0
    const turnProgressPercent = Math.max(0, Math.min(100, (turnTimeLeftMs / TURN_PHASE_DURATION_MS) * 100))

    let turnBarColor = '#2ECC71'
    if (turnTimeLeftMs <= 3_000) {
        turnBarColor = '#E74C3C'
    } else if (turnTimeLeftMs <= 6_000) {
        turnBarColor = '#F39C12'
    }

    const serverAllowedActions = (() => {
        if (!serverTableState || !currentPlayer || !isMyTurn || serverTableState.state !== 'playing') {
            return [] as Array<'hit' | 'stand' | 'double'>
        }

        const actions: Array<'hit' | 'stand' | 'double'> = ['hit', 'stand']
        const canDouble = currentPlayer.hand.length === 2 && !currentPlayer.done && !currentPlayer.busted && !currentPlayer.blackjack
        if (canDouble) {
            actions.push('double')
        }

        return actions
    })()
    
    const compatibleServerTableState = serverTableState ? {
        ...serverTableState,
        dealer: {
            hand: dealerCardsFromServer,
            total: serverTableState.dealerScore,
        },
    } : null

    return {
        showActionButtons,
        showChips,
        showPlayButton,
        isDraggingChip,
        isChipPressed,
        currentBet,
        playError,
        isStartLocked: isGameRunning,
        dealerCards,
        playerCards,
        drawPile,
        roundResult,
        roundOutcome,
        roundOutcomeDisplayDurationMs,
        roundOutcomeFadeDelayMs,
        serverTableState: compatibleServerTableState,
        walletBalance,
        enteringCardIds,
        stagedFaceDownIds,
        pendingCardIds,
        connectionStatus,
        socketError,
        serverAllowedActions,
        isMyTurn,
        currentPlayerName,
        currentPlayerAvatarUrl,
        currentPlayerSeatIndex,
        bettingTimeLeftMs,
        bettingProgressPercent,
        bettingBarColor,
        turnTimeLeftMs,
        turnProgressPercent,
        turnBarColor,
        handlePlayClick,
        handleHitClick,
        handleStandClick,
        handleDoubleClick,
        handleLeaveTable,
        handleReset,
        closeAnimationOverlay,
        handleChipDragStart,
        handleChipDragEnd,
        handleChipPointerDown,
        handleChipPointerUp,
        handleBetDragOver,
        handleBetDrop,
        handleChipClick,
        startDealerCinematic,
    }
}

