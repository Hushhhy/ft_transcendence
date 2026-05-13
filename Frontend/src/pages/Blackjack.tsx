import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlackjackGame } from '../features/blackjack/useBlackjackGame'
import { chipValues, chipThemes, cardSuitSymbols, playerSlots, IS_BACKEND_DRIVEN, getBetBreakdown, getHandTotal } from '../features/blackjack/blackjack.utils'
import type { BlackjackBackendCard, BlackjackCard } from '../features/blackjack/types'
import { RoundResultOverlay } from '../features/blackjack/RoundResultOverlay'
import { useAccountBlackjackStats } from '../features/account/useAccountBlackjackStats'
import { BlackjackMobileControls } from '../features/blackjack/BlackjackMobileControls'

function Blackjack() {
    const { t } = useTranslation()
    const {
        showActionButtons, showChips, showPlayButton,
        isDraggingChip, isChipPressed, currentBet, playError,
        isStartLocked, dealerCards, playerCards, drawPile,
        walletBalance,
        currentPlayerSeatIndex,
        roundResult, roundOutcome, roundOutcomeDisplayDurationMs, roundOutcomeFadeDelayMs, serverTableState,
        serverAllowedActions, isMyTurn, enteringCardIds, stagedFaceDownIds, pendingCardIds,
        bettingProgressPercent, bettingBarColor,
        turnProgressPercent, turnBarColor,
        connectionStatus, socketError,
        handlePlayClick, handleHitClick,
        handleStandClick, handleDoubleClick, handleLeaveTable, handleReset,
        closeAnimationOverlay,
        handleChipDragStart, handleChipDragEnd,
        handleChipPointerDown, handleChipPointerUp,
        handleBetDragOver, handleBetDrop,
        handleChipClick,
    } = useBlackjackGame()

    const {
        stats: blackjackStats,
        isLoading: isBlackjackStatsLoading,
    } = useAccountBlackjackStats()

    const dismissOutcome = useCallback(() => {
        closeAnimationOverlay()
    }, [closeAnimationOverlay])
    const effectivePlayError = playError || socketError
    const isBettingPhase = !IS_BACKEND_DRIVEN || serverTableState?.state === 'betting'
    const isDealingAnimation = pendingCardIds.length > 0 || stagedFaceDownIds.length > 0
    const showTurnCountdownBar = IS_BACKEND_DRIVEN
        && serverTableState?.state === 'playing'
        && isMyTurn
        && turnProgressPercent > 0
        && !isDealingAnimation
    const showDealerPlayingBanner = IS_BACKEND_DRIVEN && serverTableState?.state === 'settling'

    const getBackendHandTotal = (hand: Array<{ rank: string }>) => {
        let total = 0
        let aceCount = 0

        hand.forEach((card) => {
            if (card.rank === 'A') {
                total += 11
                aceCount += 1
                return
            }

            if (card.rank === 'K' || card.rank === 'Q' || card.rank === 'J') {
                total += 10
                return
            }

            total += Number(card.rank)
        })

        while (total > 21 && aceCount > 0) {
            total -= 10
            aceCount -= 1
        }

        return total
    }

    const mapBackendHandToUiCards = (hand: BlackjackBackendCard[], seatIndex: number, userId: number) => {
        const roundNumber = serverTableState?.roundNumber ?? 0

        return hand.map((card, cardIndex) => {
            let cardColor: 'red' | 'black' = 'black'
            if (card.suit === 'hearts' || card.suit === 'diamonds') {
                cardColor = 'red'
            }

            return {
                id: `seat-${seatIndex}-user-${userId}-round-${roundNumber}-card-${cardIndex}-${card.rank}-${card.suit}`,
                rank: card.rank,
                suit: card.suit,
                color: cardColor,
                faceDown: false,
            }
        })
    }

    const occupiedSeatSlots = (() => {
        const slots = new Map<number, {
            username: string
            avatarUrl?: string | null
            bet: number
            seatIndex: number
            userId: number
            handTotal: number
            handCards: BlackjackCard[]
        }>()
        const players = serverTableState?.players ?? []
        const totalSeats = playerSlots.length

        players.forEach((player) => {
            if (player.seatIndex < 0 || player.seatIndex >= totalSeats) {
                return
            }

            let uiSlotIndex = player.seatIndex
            if (currentPlayerSeatIndex !== null) {
                const relativeSeat = (player.seatIndex - currentPlayerSeatIndex + totalSeats) % totalSeats
                uiSlotIndex = (2 + relativeSeat) % totalSeats
            }

            slots.set(uiSlotIndex, {
                username: player.username,
                avatarUrl: player.avatarUrl,
                bet: player.bet,
                seatIndex: player.seatIndex,
                userId: player.userId,
                handTotal: getBackendHandTotal(player.hand),
                handCards: mapBackendHandToUiCards(player.hand, player.seatIndex, player.userId),
            })
        })

        return slots
    })()

    const goToRules = () => {
        document.getElementById('rules-section')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        })
    }

    const renderChip = (chipValue: number) => {
        const theme = chipThemes[chipValue]

        return (
            <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]" aria-hidden="true">
                <circle cx="50" cy="50" r="48" fill={theme.accent} opacity="0.98" />
                <circle cx="50" cy="50" r="43" fill="#08131c" />
                <circle cx="50" cy="50" r="37" fill={theme.rim} />
                <circle cx="50" cy="50" r="31" fill="#08131c" />
                <circle cx="50" cy="50" r="24" fill={theme.accent} opacity="0.96" />
                <circle cx="50" cy="50" r="18" fill="#08131c" opacity="0.95" />
                {Array.from({ length: 12 }).map((_, index) => {
                    const angle = index * 30
                    const rotate = `rotate(${angle} 50 50)`
                    return (
                        <rect key={`${chipValue}-${angle}`} x="47" y="2" width="6" height="12" rx="2" fill={theme.rim} transform={rotate} />
                    )
                })}
                <circle cx="50" cy="50" r="9" fill={theme.accent} opacity="0.95" />
                <text x="50" y="56" textAnchor="middle" dominantBaseline="middle" fontSize="26" fontFamily="serif" fontWeight="800" fill="#F7E6B0"
                    stroke="#08131c" strokeWidth="1.5" paintOrder="stroke fill">
                    {chipValue}
                </text>
            </svg>
        )
    }

    const visibleDealerCards = dealerCards.filter((card) => {
        if (card.faceDown) {
            return false
        }

        return true
    })

    const dealerTotal = getHandTotal(visibleDealerCards)
    const displayedDealerTotal = dealerTotal
    const playerHandSlots = [
        'left-[13%] bottom-[18.4%] -translate-x-1/2',
        'left-[29%] bottom-[6.9%] -translate-x-1/2',
        'left-[50.15%] bottom-[2.9%] -translate-x-1/2',
        'left-[71%] bottom-[6.9%] -translate-x-1/2',
        'left-[87%] bottom-[18.4%] -translate-x-1/2',
    ]

    const renderTableCard = (card: BlackjackCard, index: number, hand: 'dealer' | 'player') => {
        const isDealerHand = hand === 'dealer'
        const isEntering = enteringCardIds.includes(card.id)
        const isPending = pendingCardIds.includes(card.id)
        let offsetX = '18%'
        let offsetY = '3%'

        if (isDealerHand) {
            if (index === 0) {
                offsetX = '0%'
                offsetY = '0%'
            } else if (index === 1) {
                offsetX = '20%'
                offsetY = '0%'
            } else {
                const dealerShift = index - 1
                offsetX = `${22 + dealerShift * 17}%`
                offsetY = `${0 + dealerShift * 0}%`
            }
        } else {
            if (index === 0) {
                offsetX = '18%'
                offsetY = '3%'
            } else if (index === 1) {
                offsetX = '40%'
                offsetY = '3%'
            } else {
                const playerShift = index - 1
                offsetX = `${44 + playerShift * 17}%`
                offsetY = `${3 + playerShift * 0}%`
            }
        }

        const rotation = '0deg'
        const isStaged = stagedFaceDownIds.includes(card.id)
        let cardFlipTransform = 'rotateY(0deg)'
        if (card.faceDown || isStaged || isPending) {
            cardFlipTransform = 'rotateY(180deg)'
        }

        let cardTextColorClass = 'text-[#08131c]'
        if (card.color === 'red') {
            cardTextColorClass = 'text-[#B92E47]'
        }

        let enteringOpacity = 1
        let enteringTransform = 'translateY(0) scale(1)'
        if (isEntering || isPending) {
            enteringOpacity = 0
            enteringTransform = 'translateY(14px) scale(0.95)'
        }

        return (
            <div
                key={card.id}
                className="absolute z-10 h-[98%] w-[63%] aspect-2/3"
                style={{
                    left: offsetX,
                    top: offsetY,
                    transform: `rotate(${rotation})`,
                    perspective: '1200px',
                }}
            >
                <div
                    className="relative h-full w-full transition-[transform,opacity] duration-350 ease-out"
                    style={{
                        opacity: enteringOpacity,
                        transform: enteringTransform,
                    }}
                >
                    <div className="relative h-full w-full transition-transform duration-600 ease-out"
                        style={{
                            transformStyle: 'preserve-3d',
                            transform: cardFlipTransform,
                        }}
                    >
                    <div
                        className="absolute inset-0 overflow-hidden rounded-[3px] border border-[#D4AF37]/80 bg-[#f5efe1] p-px shadow-[0_16px_30px_rgba(0,0,0,0.35)] sm:rounded-2xl sm:p-2"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <div className={`flex h-full flex-col justify-between rounded-xs border border-[#08131c]/12 bg-[#fbf7ef] p-px text-[#08131c] sm:rounded-xl sm:p-2`}>
                            <div className={`flex flex-col text-left font-aeonik text-[0.45rem] leading-none sm:text-[0.72rem] ${cardTextColorClass}`}>
                                <span>{card.rank}</span>
                                <span className="text-[0.45rem] sm:text-[0.72rem]">{cardSuitSymbols[card.suit]}</span>
                            </div>
                            <div className={`self-center text-[0.6rem] sm:text-xl ${cardTextColorClass}`}>
                                {cardSuitSymbols[card.suit]}
                            </div>
                            <div className={`flex rotate-180 flex-col text-left font-aeonik text-[0.45rem] leading-none sm:text-[0.72rem] ${cardTextColorClass}`}>
                                <span>{card.rank}</span>
                                <span className="text-[0.45rem] sm:text-[0.72rem]">{cardSuitSymbols[card.suit]}</span>
                            </div>
                        </div>
                    </div>
                    <div
                        className="absolute inset-0 overflow-hidden rounded-[3px] border border-[#D4AF37]/80 bg-linear-to-br from-[#0f2534] via-[#08131c] to-[#13293a] p-px shadow-[0_16px_30px_rgba(0,0,0,0.35)] sm:rounded-2xl sm:p-2"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <div className="flex h-full flex-col items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_52%)]">
                            <div className="text-[0.7rem] uppercase tracking-[0.24em] text-[#F3DC9B]/85">Blackjack</div>
                            <div className="mt-2 flex h-8 w-8 items-center justify-center rounded-full border border-[#F3DC9B]/60 text-[#F3DC9B]">
                                <img src="/blackjack_diamond.svg?v=2" alt="" className="h-5 w-5 object-contain" />
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        )
    }

    let chipCursorClass = 'cursor-grab'
    if (isDraggingChip) {
        chipCursorClass = 'cursor-grabbing'
    }
    if (isChipPressed) {
        chipCursorClass = 'cursor-grabbing'
    }

    const renderBetZoneTokens = () => {
        if (currentBet === 0) {
            return (
                <div className="rounded-full border border-[#D4AF37]/45 bg-[#08131c]/70 px-3 py-2 text-center font-seravek text-[0.72rem] text-white/60">
                    {t('bjDragDrop')}
                </div>
            )
        }

        return getBetBreakdown(currentBet).map((token, index) => (
            <div key={`${token}-${index}-board`} className="h-12 w-12">
                    {renderChip(token)}
            </div>
        ))
    }

    const canResetRound = (isBettingPhase && currentBet > 0) || (!isBettingPhase && (!isStartLocked || roundResult !== ''))
    let betZoneLabel = t('bjBetsClosed')
    if (isBettingPhase) {
        betZoneLabel = t('bjDepositBet')
    }
    let betZoneClassName = 'relative flex flex-1 flex-col items-center justify-center overflow-visible rounded-3xl border-2 border-dashed px-3 py-4 shadow-[0_0_0_1px_rgba(212,175,55,0.08)] backdrop-blur-[2px] border-[#D4AF37]/30 bg-[#0e1a25]/40 opacity-70'
    if (isBettingPhase) {
        betZoneClassName = 'relative flex flex-1 flex-col items-center justify-center overflow-visible rounded-3xl border-2 border-dashed px-3 py-4 shadow-[0_0_0_1px_rgba(212,175,55,0.08)] backdrop-blur-[2px] border-[#D4AF37]/75 bg-[#0e1a25]/75'
    }
    let resetButtonClassName = 'flex-1 rounded-lg border border-[#F3DC9B] bg-[#D4AF37]/15 py-2 font-aeonik text-xs uppercase tracking-wide text-[#F3DC9B] transition hover:bg-[#D4AF37]/25'
    if (!canResetRound) {
        resetButtonClassName = 'flex-1 cursor-not-allowed rounded-lg border border-[#F3DC9B]/40 bg-[#D4AF37]/8 py-2 font-aeonik text-xs uppercase tracking-wide text-[#F3DC9B]/45 opacity-70'
    }

    let canDouble = false
    if (IS_BACKEND_DRIVEN) {
        canDouble = connectionStatus === 'connected' && isStartLocked && isMyTurn && serverAllowedActions.includes('double')
    } else if (isStartLocked && roundResult === '' && playerCards.length === 2 && drawPile.length > 0) {
        canDouble = true
    }

    let canStand = false
    if (IS_BACKEND_DRIVEN) {
        canStand = connectionStatus === 'connected' && isStartLocked && isMyTurn && serverAllowedActions.includes('stand')
    } else if (isStartLocked && roundResult === '' && playerCards.length >= 2) {
        canStand = true
    }

    let canHit = false
    if (IS_BACKEND_DRIVEN) {
        canHit = connectionStatus === 'connected' && isStartLocked && isMyTurn && serverAllowedActions.includes('hit')
    } else if (isStartLocked && roundResult === '' && playerCards.length >= 2 && drawPile.length > 0) {
        canHit = true
    }

    let tirerButtonClassName = 'flex-1 rounded-lg border border-[#F3DC9B] bg-[#D4AF37]/15 py-2 font-aeonik text-xs uppercase tracking-wide text-[#F3DC9B] transition hover:bg-[#D4AF37]/25'
    if (!canHit) {
        tirerButtonClassName = 'flex-1 cursor-not-allowed rounded-lg border border-[#F3DC9B]/40 bg-[#D4AF37]/8 py-2 font-aeonik text-xs uppercase tracking-wide text-[#F3DC9B]/45 opacity-70'
    }

    let passerButtonClassName = 'flex-1 rounded-lg border border-[#F3DC9B] bg-[#D4AF37]/15 py-2 font-aeonik text-xs uppercase tracking-wide text-[#F3DC9B] transition hover:bg-[#D4AF37]/25'
    if (!canStand) {
        passerButtonClassName = 'flex-1 cursor-not-allowed rounded-lg border border-[#F3DC9B]/40 bg-[#D4AF37]/8 py-2 font-aeonik text-xs uppercase tracking-wide text-[#F3DC9B]/45 opacity-70'
    }

    let doubleButtonClassName = 'flex-1 rounded-lg border border-[#F3DC9B] bg-[#D4AF37]/15 py-2 font-aeonik text-xs uppercase tracking-wide text-[#F3DC9B] transition hover:bg-[#D4AF37]/25'
    if (!canDouble) {
        doubleButtonClassName = 'flex-1 cursor-not-allowed rounded-lg border border-[#F3DC9B]/40 bg-[#D4AF37]/8 py-2 font-aeonik text-xs uppercase tracking-wide text-[#F3DC9B]/45 opacity-70'
    }

    return (
        <>
            {roundOutcome && (
                <RoundResultOverlay
                    outcome={roundOutcome}
                    onDone={dismissOutcome}
                    displayDurationMs={roundOutcomeDisplayDurationMs ?? undefined}
                    fadeDelayMs={roundOutcomeFadeDelayMs ?? undefined}
                />
            )}

            <section className="px-1 pt-8 sm:px-6 lg:px-10">
                <div className="relative mx-auto w-full max-w-370">
                    <div className="absolute -left-15 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-1 lg:flex">
                        <h1 className="font-seravek text-sm text-white/95">{t('gameRulesTitle')}</h1>
                        <button type="button" onClick={goToRules} aria-label="Go to rules left" className="group relative h-8 w-14 cursor-pointer">
                            <svg width="56" height="32" viewBox="0 0 64 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
                                className="absolute inset-0 transition-all duration-300 ease-out group-hover:translate-y-1 group-hover:opacity-75">
                                <path d="M8 8L32 32L56 8" stroke="#D4AF37" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <svg width="56" height="32" viewBox="0 0 64 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
                                className="absolute inset-0 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-3 group-hover:opacity-100">
                                <path d="M8 8L32 32L56 8" stroke="#D4AF37" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    {showPlayButton && (
                        <div className="absolute -right-17 top-[10%] z-30 hidden flex-col items-end gap-2 lg:flex">
                            <button type="button" onClick={handlePlayClick} className="group relative h-15 w-25 cursor-pointer rounded-xl border border-[#D4AF37] transition hover:bg-white/15">
                                <h1 className='font-aeonik text-white hover:underline'>{t('play')}</h1>
                            </button>
                            {effectivePlayError && (
                                <p className="w-48 -mr-12 text-center text-sm font-seravek text-red-300">
                                    {effectivePlayError}
                                </p>
                            )}
                        </div>
                    )}
                    {showActionButtons && (
                        <div className="absolute -right-20 top-[58%] z-30 hidden w-35 flex-col gap-5 lg:flex">
                            <button type="button" onClick={handleHitClick} disabled={!canHit} className={tirerButtonClassName}>{t('bjHit')}</button>
                            <button type="button" onClick={handleStandClick} disabled={!canStand} className={passerButtonClassName}>{t('bjStand')}</button>
                            <button type="button" onClick={handleDoubleClick} disabled={!canDouble} className={doubleButtonClassName}>{t('bjDouble')}</button>
                        </div>
                    )}
                    {showChips && isBettingPhase && (
                        <div className="absolute -right-22 top-[8%] z-30 hidden w-42 justify-center lg:flex">
                            <button
                                type="button"
                                onClick={handleLeaveTable}
                                className="w-full rounded-lg border border-red-300/70 bg-red-500/15 py-2 font-aeonik text-xs uppercase tracking-wide text-red-200 transition hover:bg-red-500/25"
                            >
                                {t('bjLeaveTable')}
                            </button>
                        </div>
                    )}
                    {showChips && isBettingPhase && (
                        <div className="absolute -right-22 top-[14%] z-30 hidden w-42 justify-center lg:flex">
                            <div className="w-full rounded-lg border border-[#D4AF37]/70 bg-[#0e1a25]/80 py-2 text-center font-aeonik text-xs uppercase tracking-[0.16em] text-[#F3DC9B]">
                                {t('balance')} : {Math.trunc(walletBalance)} €
                            </div>
                        </div>
                    )}
                    {showChips && isBettingPhase && (
                        <div className="absolute -right-22 top-[20%] z-30 hidden w-42 flex-col gap-4 lg:flex">
                            <div className="grid grid-cols-2 gap-3">
                                {chipValues.map((chip) => {
                                    return (
                                        <button key={chip} type="button" draggable onPointerDown={handleChipPointerDown} onPointerUp={handleChipPointerUp}
                                            onPointerLeave={handleChipPointerUp} onDragStart={handleChipDragStart(chip)} onDragEnd={handleChipDragEnd}
                                            aria-label={`Jeton ${chip} euros`}
                                            className={`group flex h-15 w-15 items-center justify-center rounded-full border transition duration-200 ${chipCursorClass}`}>
                                            {renderChip(chip)}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    <div className="relative mx-auto w-full max-w-310.5 overflow-hidden rounded-[28px] border border-[#D4AF37]/55 shadow-[0_24px_60px_rgba(0,0,0,0.55)]" style={{ aspectRatio: '1242 / 848' }}>
                    <div className="absolute inset-0 bg-[#08131c]" />
                    <div className="absolute left-[2.3%] top-[2.3%] h-[28%] w-[21%] border-l-4 border-t-4 border-[#D4AF37]/80" />
                    <div className="absolute right-[2.3%] top-[2.3%] h-[28%] w-[21%] border-r-4 border-t-4 border-[#D4AF37]/80" />
                    <div className="absolute left-[2.3%] bottom-[2.3%] h-[28%] w-[21%] border-l-4 border-b-4 border-[#D4AF37]/80" />
                    <div className="absolute right-[2.3%] bottom-[2.3%] h-[28%] w-[21%] border-r-4 border-b-4 border-[#D4AF37]/80" />
                    <div className="absolute inset-0 z-10 -translate-y-[4%]">
                        <div className="absolute inset-x-0 top-[40%] flex items-center justify-center">
                            <div className="flex w-[56%] items-center justify-center">
                                <span className="h-px flex-1 bg-[#D4AF37]/85" />
                                <img src="/blackjack_emerald.svg" alt="" aria-hidden="true" className="mx-3 h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
                                <span className="h-px flex-1 bg-[#D4AF37]/85" />
                            </div>
                        </div>
                        <div className="absolute left-1/2 top-[37%] w-[80%] -translate-x-1/2 text-[#D9BE80]" style={{ textShadow: '0 0 8px rgba(0,0,0,0.45)' }}>
                            <svg viewBox="0 0 1200 340" className="w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                                <path id="bj-title-arc-main" d="M120 80 Q600 218 1080 80" fill="none" />
                                <path id="bj-title-arc-second" d="M120 130 Q600 240 1080 130" fill="none" />
                                <path id="bj-title-arc-third" d="M150 180 Q600 300 1080 180" fill="none" />
                                <text fill="#D9BE80" fontSize="60" fontFamily="serif" fontWeight="500" letterSpacing="0.7">
                                    <textPath href="#bj-title-arc-main" startOffset="50%" textAnchor="middle">BLACKJACK PAYS 3 TO 2</textPath>
                                </text>
                                <text fill="#D9BE80" fontSize="35" fontFamily="serif" fontWeight="500" letterSpacing="0.7">
                                    <textPath href="#bj-title-arc-second" startOffset="50%" textAnchor="middle">Dealer must draw to 16, stand on 17</textPath>
                                </text>
                                <path d="M180 150 Q600 230 1010 150" fill="none" stroke="#D4AF37" strokeWidth="2" strokeOpacity="1" />
                                <path d="M170 200 Q600 300 1020 200" fill="none" stroke="#D4AF37" strokeWidth="2" strokeOpacity="1" />
                                <path d="M180 150 Q150 165 170 200" fill="none" stroke="#D4AF37" strokeWidth="2" strokeOpacity="1" strokeLinecap="round" />
                                <path d="M1010 150 Q1040 165 1020 200" fill="none" stroke="#D4AF37" strokeWidth="2" strokeOpacity="1" strokeLinecap="round" />
                                <text fill="#D9BE80" fontSize="40" fontFamily="serif" fontWeight="500" letterSpacing="0.12">
                                    <textPath href="#bj-title-arc-third" startOffset="16%" textAnchor="middle">PAYS 2 TO 1</textPath>
                                </text>
                                <text fill="#D9BE80" fontSize="42" fontFamily="serif" fontWeight="500" letterSpacing="0.12">
                                    <textPath href="#bj-title-arc-third" startOffset="48%" textAnchor="middle">INSURANCE</textPath>
                                </text>
                                <text fill="#D9BE80" fontSize="40" fontFamily="serif" fontWeight="500" letterSpacing="0.12">
                                    <textPath href="#bj-title-arc-third" startOffset="80%" textAnchor="middle">PAYS 2 TO 1</textPath>
                                </text>
                            </svg>
                        </div>
                        <div className="absolute left-1/2 top-[12%] z-0 h-[20%] w-[10%] -translate-x-1/2 rounded-2xl border-[3px] border-[#D4AF37]/80" />
                        <div className="absolute top-[12.3%] left-[52.8%] z-20 h-[20%] w-[15.3%] -translate-x-1/2">
                            {dealerCards.map((card, index) => renderTableCard(card, index, 'dealer'))}
                        </div>
                        <p className="absolute left-1/2 top-[35%] z-20 hidden -translate-x-1/2 text-center font-aeonik text-sm text-[#F3DC9B] lg:block">
                            Dealer : {displayedDealerTotal}
                        </p>
                        {showDealerPlayingBanner && (
                            <div className="absolute left-1/2 top-[8%] z-30 -translate-x-1/2 rounded-full border border-[#D4AF37]/70 bg-[#08131c]/85 px-4 py-2 text-center font-aeonik text-xs uppercase tracking-[0.2em] text-[#F3DC9B] shadow-[0_10px_25px_rgba(0,0,0,0.35)]">
                                {t('bjDealerPlaying')}
                            </div>
                        )}
                        {IS_BACKEND_DRIVEN ? (
                            playerHandSlots.map((handSlotClassName, index) => {
                                const seatedPlayer = occupiedSeatSlots.get(index)
                                if (!seatedPlayer) {
                                    return null
                                }

                                const isTurnSeat = serverTableState?.state === 'playing'
                                    && serverTableState.currentTurnSeatIndex === seatedPlayer.seatIndex
                                    && turnProgressPercent > 0
                                    && !isDealingAnimation

                                return (
                                    <div key={`seat-hand-${index}`} className={`absolute z-20 h-[19.9%] w-[15.5%] overflow-visible ${handSlotClassName}`}>
                                        <div className="relative h-full w-full overflow-visible">
                                            {seatedPlayer.handCards.map((card, cardIndex) => renderTableCard(card, cardIndex, 'player'))}
                                            {isTurnSeat && (
                                                <div className="absolute left-1/2 top-full z-20 mt-1 hidden h-2 w-[63%] -translate-x-1/2 overflow-hidden rounded-full border border-[#D4AF37]/60 bg-[#0e1a25]/70 lg:block">
                                                    <div
                                                        className="h-full transition-all duration-100"
                                                        style={{
                                                            width: `${turnProgressPercent}%`,
                                                            backgroundColor: turnBarColor,
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="absolute left-[50.15%] bottom-[2.9%] z-20 h-[19.9%] w-[15.5%] -translate-x-1/2 overflow-visible">
                                <div className="relative h-full w-full overflow-visible">
                                    {playerCards.map((card, index) => renderTableCard(card, index, 'player'))}
                                    {showTurnCountdownBar && (
                                        <div className="absolute left-1/2 top-full z-20 mt-1 hidden h-2 w-[63%] -translate-x-1/2 overflow-hidden rounded-full border border-[#D4AF37]/60 bg-[#0e1a25]/70 lg:block">
                                            <div
                                                className="h-full transition-all duration-100"
                                                style={{
                                                    width: `${turnProgressPercent}%`,
                                                    backgroundColor: turnBarColor,
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {roundResult && (
                            <p className="absolute left-1/2 bottom-[30%] z-20 -translate-x-1/2 text-center font-aeonik text-sm text-[#F3DC9B]">
                                {roundResult}
                            </p>
                        )}
                        {showChips && (
                            <div className="absolute right-[6.5%] top-[11.5%] hidden h-[26%] w-[20%] items-stretch gap-2 lg:flex">
                                <div onDragOver={handleBetDragOver} onDrop={handleBetDrop} className={betZoneClassName}>
                                    {effectivePlayError && (
                                        <p className="mb-2 text-center font-seravek text-xs text-red-300">
                                            {effectivePlayError}
                                        </p>
                                    )}
                                    <p className="mb-2 text-center font-aeonik text-[0.72rem] uppercase tracking-[0.22em] text-[#F3DC9B]">
                                        {betZoneLabel}
                                    </p>
                                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                                        {renderBetZoneTokens()}
                                    </div>
                                    <p className="mt-2 font-aeonik text-sm text-[#F3DC9B]">{currentBet}€</p>
                                    <div className="mt-4 flex w-full gap-2">
                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleReset(); }} disabled={!canResetRound} className={resetButtonClassName}>
                                            {t('bjReset')}
                                        </button>
                                    </div>
                                </div>
                                {isBettingPhase && (
                                    <div className="flex w-2.5 flex-col justify-end overflow-hidden rounded-full border border-[#D4AF37]/60 bg-[#0e1a25]/70">
                                        <div
                                            className="w-full transition-all duration-100"
                                            style={{
                                                height: `${bettingProgressPercent}%`,
                                                backgroundColor: bettingBarColor,
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        {playerSlots.map((slot, index) => {
                            const seatedPlayer = occupiedSeatSlots.get(index)
                            let slotClassName = `absolute z-0 h-[20%] w-[10%] rounded-2xl border-[3px] border-[#D4AF37]/80 ${slot.pos}`
                            if (seatedPlayer) {
                                slotClassName = `absolute z-0 h-[20%] w-[10%] rounded-2xl border-[3px] border-[#D4AF37]/95 bg-[#0e1a25]/55 ${slot.pos}`
                            }
                            return (
                                <div key={slot.pos} className={slotClassName}>
                                    {seatedPlayer && (
                                        <div className="relative h-full w-full overflow-visible">
                                            <div className="absolute left-1/2 bottom-full z-30 mb-1.5 hidden -translate-x-1/2 rounded-full border border-[#D4AF37]/65 bg-[#0e1a25]/85 px-3 py-1 text-center font-aeonik text-[0.68rem] uppercase tracking-[0.16em] text-[#F3DC9B] lg:block">
                                                {Math.trunc(seatedPlayer.bet)} €
                                            </div>
                                            <div className="absolute left-1/2 top-[52%] z-0 hidden h-30 w-30 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-[#D4AF37]/75 bg-[#08131c] shadow-[0_14px_26px_rgba(0,0,0,0.45)] lg:block">
                                                <img
                                                    src={seatedPlayer.avatarUrl || '/profile.svg'}
                                                    alt={seatedPlayer.username}
                                                    className="h-full w-full object-cover"
                                                    onError={(event) => {
                                                        const target = event.currentTarget
                                                        target.onerror = null
                                                        target.src = '/profile.svg'
                                                    }}
                                                />
                                            </div>
                                            <p className="absolute left-1/2 -bottom-[34%] z-20 hidden w-[280%] -translate-x-1/2 truncate text-center font-aeonik text-sm text-[#F3DC9B] lg:block">
                                                {seatedPlayer.username} : {seatedPlayer.handTotal}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    </div>
                    <BlackjackMobileControls
                        isStartLocked={isStartLocked}
                        isBettingPhase={isBettingPhase}
                        showChips={showChips}
                        showPlayButton={showPlayButton}
                        showActionButtons={showActionButtons}
                        showTurnCountdownBar={showTurnCountdownBar}
                        currentBet={currentBet}
                        walletBalance={walletBalance}
                        effectivePlayError={effectivePlayError}
                        canResetRound={canResetRound}
                        canHit={canHit}
                        canStand={canStand}
                        canDouble={canDouble}
                        betZoneLabel={betZoneLabel}
                        resetButtonClassName={resetButtonClassName}
                        displayedDealerTotal={displayedDealerTotal}
                        mySlot={occupiedSeatSlots.get(2)}
                        bettingProgressPercent={bettingProgressPercent}
                        bettingBarColor={bettingBarColor}
                        turnProgressPercent={turnProgressPercent}
                        turnBarColor={turnBarColor}
                        handlePlayClick={handlePlayClick}
                        handleHitClick={handleHitClick}
                        handleStandClick={handleStandClick}
                        handleDoubleClick={handleDoubleClick}
                        handleLeaveTable={handleLeaveTable}
                        handleReset={handleReset}
                        handleChipClick={handleChipClick}
                        handleBetDragOver={handleBetDragOver}
                        handleBetDrop={handleBetDrop}
                        renderChip={renderChip}
                    />
                </div>
            </section>

            <section id="rules-section" className="text-white">
                <div className="mx-7.5 mt-10 border-t border-[#D4AF37]" />
                <div className="mx-auto mt-12 w-full max-w-295 px-7.5">
                    <h1 className="font-aeonik text-[2rem] uppercase tracking-tight">{t('gameArtOfDuelTitle')}</h1>
                    <div className="mt-8 grid grid-cols-1 items-start gap-8 md:grid-cols-[1fr_auto_1fr] md:gap-10">
                        <div>
                            <h2 className="font-aeonik text-2xl">{t('gameRulesTitle')}</h2>
                            <p className="mt-3 max-w-140 font-seravek text-[1.02rem] leading-7 text-white/70">
                                {t('blackjackRulesText')}
                            </p>
                        </div>
                        <div className="hidden h-24 self-center border-l border-[#D4AF37] md:block" />
                        <div>
                            <h2 className="font-aeonik text-2xl">{t('gameStrategyTitle')}</h2>
                            <p className="mt-3 max-w-140 font-seravek text-[1.02rem] leading-7 text-white/70">
                                {t('blackjackStrategyText')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="text-white mt-22">
                <div className="mx-auto mt-12 w-full max-w-295 px-7.5">
                    <h1 className="font-aeonik text-[2rem] tracking-tight">{t('bjLastGames')}</h1>
                    <div className="mt-10 px-4">
                        <div className="grid grid-cols-[1.2fr_1fr_1fr] text-sm text-white/65">
                            <p>{t('bjDate')}</p>
                            <p className="text-center">{t('bjResult')}</p>
                            <p className="text-right">{t('bjAmount')}</p>
                        </div>
                        <div className="mt-2 border-t border-[#D4AF37]" />
                        {isBlackjackStatsLoading ? (
                            <div className="py-4 text-sm text-white/50">Chargement...</div>
                        ) : !blackjackStats?.recentRounds.length ? (
                            <div className="py-4 text-sm text-white/50">Aucune manche enregistrée pour le moment.</div>
                        ) : (
                            blackjackStats.recentRounds.map((round) => {
                                const cause = {
                                    bust: 'Bust',
                                    victory: 'Victoire',
                                    defeat: 'Défaite',
                                    blackjack: 'Blackjack',
                                    push: 'Push',
                                }[round.cause] ?? round.cause
                                const absolute = Math.abs(round.netAmount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                const amount = `${round.netAmount > 0 ? '+' : round.netAmount < 0 ? '-' : ''}${absolute} €`
                                const amountColor = round.netAmount >= 0 ? 'text-green-300' : 'text-red-300'
                                return (
                                    <div key={round.id} className="border-b border-[#D4AF37] py-3">
                                        <div className="grid grid-cols-[1.2fr_1fr_1fr] items-center text-sm">
                                            <p className="font-seravek text-white/85">{new Date(round.createdAt).toLocaleString('fr-FR')}</p>
                                            <p className="text-center font-seravek text-white/75">{cause}</p>
                                            <p className={`text-right font-seravek ${amountColor}`}>{amount}</p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </section>
        </>
    )
}

export default Blackjack
