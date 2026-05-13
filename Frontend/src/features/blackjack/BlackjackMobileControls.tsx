import { useTranslation } from 'react-i18next'
import { chipValues, getBetBreakdown } from './blackjack.utils'

interface Props {
    // State
    isStartLocked: boolean
    isBettingPhase: boolean
    showChips: boolean
    showPlayButton: boolean
    showActionButtons: boolean
    showTurnCountdownBar: boolean
    currentBet: number
    walletBalance: number
    effectivePlayError: string | null | undefined
    canResetRound: boolean
    canHit: boolean
    canStand: boolean
    canDouble: boolean
    betZoneLabel: string
    resetButtonClassName: string
    // Scores
    displayedDealerTotal: number
    mySlot: { username: string; handTotal: number } | undefined
    // Timers
    bettingProgressPercent: number
    bettingBarColor: string
    turnProgressPercent: number
    turnBarColor: string
    // Handlers
    handlePlayClick: () => void
    handleHitClick: () => void
    handleStandClick: () => void
    handleDoubleClick: () => void
    handleLeaveTable: () => void
    handleReset: () => void
    handleChipClick: (chip: number) => void
    handleBetDragOver: (e: React.DragEvent<HTMLDivElement>) => void
    handleBetDrop: (e: React.DragEvent<HTMLDivElement>) => void
    // Card renderer (shared with desktop)
    renderChip: (chipValue: number) => React.ReactNode
}

export function BlackjackMobileControls({
    isStartLocked,
    isBettingPhase,
    showChips,
    showPlayButton,
    showActionButtons,
    showTurnCountdownBar,
    currentBet,
    walletBalance,
    effectivePlayError,
    canResetRound,
    canHit,
    canStand,
    canDouble,
    betZoneLabel,
    resetButtonClassName,
    displayedDealerTotal,
    mySlot,
    bettingProgressPercent,
    bettingBarColor,
    turnProgressPercent,
    turnBarColor,
    handlePlayClick,
    handleHitClick,
    handleStandClick,
    handleDoubleClick,
    handleLeaveTable,
    handleReset,
    handleChipClick,
    handleBetDragOver,
    handleBetDrop,
    renderChip,
}: Props) {
    const { t } = useTranslation()

    return (
        <div className="mt-4 flex flex-col gap-3 lg:hidden">
            {isStartLocked && (
                <div className="flex items-center justify-around rounded-xl border border-[#D4AF37]/40 bg-[#0e1a25]/70 px-4 py-2">
                    <span className="font-aeonik text-sm text-[#F3DC9B]">
                        Dealer : {displayedDealerTotal}
                    </span>
                    {mySlot && (
                        <>
                            <span className="h-4 w-px bg-[#D4AF37]/40" />
                            <span className="font-aeonik text-sm text-[#F3DC9B]">
                                {mySlot.username} : {mySlot.handTotal}
                            </span>
                        </>
                    )}
                </div>
            )}
            {showChips && isBettingPhase && (
                <div className="flex gap-3">
                    <div className="flex-1 rounded-lg border border-[#D4AF37]/70 bg-[#0e1a25]/80 py-2 text-center font-aeonik text-xs uppercase tracking-[0.16em] text-[#F3DC9B]">
                        {t('balance')} : {Math.trunc(walletBalance)} €
                    </div>
                    <button
                        type="button"
                        onClick={handleLeaveTable}
                        className="flex-1 rounded-lg border border-red-300/70 bg-red-500/15 py-2 font-aeonik text-xs uppercase tracking-wide text-red-200 transition hover:bg-red-500/25"
                    >
                        {t('bjLeaveTable')}
                    </button>
                </div>
            )}
            {showPlayButton && (
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={handlePlayClick}
                        className="w-full rounded-xl border border-[#D4AF37] bg-[#D4AF37]/15 py-3 font-aeonik text-white transition hover:bg-white/15"
                    >
                        {t('play')}
                    </button>
                    {effectivePlayError && (
                        <p className="text-center text-sm font-seravek text-red-300">{effectivePlayError}</p>
                    )}
                </div>
            )}
            {showChips && (
                <div
                    onDragOver={handleBetDragOver}
                    onDrop={handleBetDrop}
                    className={`relative flex flex-col items-center justify-center overflow-visible rounded-3xl border-2 border-dashed px-3 py-4 shadow-[0_0_0_1px_rgba(212,175,55,0.08)] backdrop-blur-[2px] ${isBettingPhase ? 'border-[#D4AF37]/75 bg-[#0e1a25]/75' : 'border-[#D4AF37]/30 bg-[#0e1a25]/40 opacity-70'}`}
                >
                    {effectivePlayError && (
                        <p className="mb-2 text-center font-seravek text-xs text-red-300">{effectivePlayError}</p>
                    )}
                    <p className="mb-2 text-center font-aeonik text-[0.72rem] uppercase tracking-[0.22em] text-[#F3DC9B]">
                        {betZoneLabel}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {currentBet === 0 ? (
                            <div className="rounded-full border border-[#D4AF37]/45 bg-[#08131c]/70 px-3 py-2 text-center font-seravek text-[0.72rem] text-white/60">
                                {t('bjTapToAdd')}
                            </div>
                        ) : (
                            getBetBreakdown(currentBet).map((token, index) => (
                                <div key={`${token}-${index}-mobile`} className="h-10 w-10">
                                    {renderChip(token)}
                                </div>
                            ))
                        )}
                    </div>
                    <p className="mt-2 font-aeonik text-sm text-[#F3DC9B]">{currentBet}€</p>
                    <div className="mt-3 flex w-full gap-2">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleReset() }}
                            disabled={!canResetRound}
                            className={resetButtonClassName}
                        >
                            {t('bjReset')}
                        </button>
                    </div>
                </div>
            )}
            {showChips && isBettingPhase && (
                <div className="grid grid-cols-4 gap-3">
                    {chipValues.map((chip) => (
                        <button
                            key={chip}
                            type="button"
                            onClick={() => handleChipClick(chip)}
                            aria-label={`Jeton ${chip} euros`}
                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full transition duration-200 active:scale-95"
                        >
                            {renderChip(chip)}
                        </button>
                    ))}
                </div>
            )}
            {isBettingPhase && (
                <div className="overflow-hidden rounded-full border border-[#D4AF37]/60 bg-[#0e1a25]/70" style={{ height: '10px' }}>
                    <div
                        className="h-full transition-all duration-100"
                        style={{ width: `${bettingProgressPercent}%`, backgroundColor: bettingBarColor }}
                    />
                </div>
            )}
            {showTurnCountdownBar && (
                <div className="overflow-hidden rounded-full border border-[#D4AF37]/60 bg-[#0e1a25]/70" style={{ height: '10px' }}>
                    <div
                        className="h-full transition-all duration-100"
                        style={{ width: `${turnProgressPercent}%`, backgroundColor: turnBarColor }}
                    />
                </div>
            )}
            {showActionButtons && (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleHitClick}
                        disabled={!canHit}
                        className={`flex-1 rounded-lg border py-3 font-aeonik text-xs uppercase tracking-wide transition ${canHit ? 'border-[#F3DC9B] bg-[#D4AF37]/15 text-[#F3DC9B] hover:bg-[#D4AF37]/25' : 'cursor-not-allowed border-[#F3DC9B]/40 bg-[#D4AF37]/8 text-[#F3DC9B]/45 opacity-70'}`}
                    >
                        {t('bjHit')}
                    </button>
                    <button
                        type="button"
                        onClick={handleStandClick}
                        disabled={!canStand}
                        className={`flex-1 rounded-lg border py-3 font-aeonik text-xs uppercase tracking-wide transition ${canStand ? 'border-[#F3DC9B] bg-[#D4AF37]/15 text-[#F3DC9B] hover:bg-[#D4AF37]/25' : 'cursor-not-allowed border-[#F3DC9B]/40 bg-[#D4AF37]/8 text-[#F3DC9B]/45 opacity-70'}`}
                    >
                        {t('bjStand')}
                    </button>
                    <button
                        type="button"
                        onClick={handleDoubleClick}
                        disabled={!canDouble}
                        className={`flex-1 rounded-lg border py-3 font-aeonik text-xs uppercase tracking-wide transition ${canDouble ? 'border-[#F3DC9B] bg-[#D4AF37]/15 text-[#F3DC9B] hover:bg-[#D4AF37]/25' : 'cursor-not-allowed border-[#F3DC9B]/40 bg-[#D4AF37]/8 text-[#F3DC9B]/45 opacity-70'}`}
                    >
                        {t('bjDouble')}
                    </button>
                </div>
            )}
        </div>
    )
}
