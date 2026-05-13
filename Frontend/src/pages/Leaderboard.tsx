import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import type { Friend, ApiResponse } from '../features/account/types'
import type { ViewMode } from '../features/leaderboard/leaderboard.types'
import { useLeaderboard } from '../features/leaderboard/useLeaderboard'
import { PODIUM_ORDER, PODIUM_HEIGHT, PODIUM_BORDER, PODIUM_TEXT, RANK_TEXT } from '../features/leaderboard/leaderboard.constants'

function Leaderboard() {
    const { t } = useTranslation()
    const user = useAuthStore((state) => state.user)
    const [viewMode, setViewMode] = useState<ViewMode>('global')
    const { players: allPlayers, isLoading, error } = useLeaderboard()
    const [friendUsernames, setFriendUsernames] = useState<Set<string>>(new Set())

    const currentUsername = user?.username ?? null
    const currentAvatarUrl = user?.avatarUrl ?? null

    useEffect(() => {
        api.get<ApiResponse<Friend[]>>('/friends')
            .then((res) => {
                if (res.data.status === 'success' && res.data.data) {
                    setFriendUsernames(new Set(res.data.data.map((f) => f.username)))
                }
            })
            .catch(() => {})
    }, [])

    let players = allPlayers
    if (viewMode === 'friends') {
        players = allPlayers.filter(
            (p) => friendUsernames.has(p.username) || p.username === currentUsername
        )
    }

    const top3 = players.slice(0, 3)
    const currentUserInList = Boolean(currentUsername) && players.some((p) => p.username === currentUsername)

    let globalBtnClass = 'px-4 py-2 transition text-white/60 hover:bg-white/10'
    if (viewMode === 'global') globalBtnClass = 'px-4 py-2 transition bg-[#D4AF37] text-black font-bold'

    let friendsBtnClass = 'px-4 py-2 transition text-white/60 hover:bg-white/10'
    if (viewMode === 'friends') friendsBtnClass = 'px-4 py-2 transition bg-[#D4AF37] text-black font-bold'

    return (
        <div className="w-full px-4 sm:px-6 lg:px-10 max-w-362 mx-auto pb-10">

            <div className="flex items-center justify-between mt-6 sm:mt-10 mb-8">
                <h1 className="font-aeonik text-2xl sm:text-3xl text-white">
                    {t('leaderboardTitle')}
                </h1>
                <div className="flex rounded-xl border border-white/20 overflow-hidden font-seravek text-sm">
                    <button onClick={() => setViewMode('global')} className={globalBtnClass}>
                        {t('leaderboardGlobal')}
                    </button>
                    <button onClick={() => setViewMode('friends')} className={friendsBtnClass}>
                        {t('leaderboardFriends')}
                    </button>
                </div>
            </div>

            {top3.length >= 3 && (
                <div className="flex items-end justify-center gap-3 sm:gap-6 mb-10">
                    {PODIUM_ORDER.map((playerIndex) => {
                        const player = top3[playerIndex]
                        if (!player) return null

                        const rank = playerIndex + 1
                        const isCurrentUser = player.username === currentUsername
                        const textColor = PODIUM_TEXT[playerIndex] ?? 'text-white'
                        const borderColor = PODIUM_BORDER[playerIndex] ?? 'border-white/30'
                        const blockHeight = PODIUM_HEIGHT[playerIndex] ?? 'h-16'

                        let avatarContent = <span className="font-aeonik text-xl text-[#1f2f37]">{player.username.charAt(0).toUpperCase()}</span>
                        const resolvedAvatar = isCurrentUser ? currentAvatarUrl : player.avatarUrl
                        if (resolvedAvatar) {
                            avatarContent = <img src={resolvedAvatar} alt={player.username} className="h-full w-full object-cover" />
                        }

                        return (
                            <div key={player.id} className="flex flex-col items-center gap-1.5 w-24 sm:w-28">
                                <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 overflow-hidden bg-[#D9D9D9] flex items-center justify-center ${borderColor}`}>
                                    {avatarContent}
                                </div>
                                <span className="font-seravek text-white text-xs sm:text-sm truncate w-full text-center">{player.username}</span>
                                <span className={`font-seravek text-xs ${textColor}`}>{player.gamesWon} pts</span>
                                <div className={`flex items-center justify-center w-full ${blockHeight} rounded-t-xl border-t-2 border-x-2 ${borderColor} bg-white/5`}>
                                    <span className={`font-aeonik text-2xl font-bold ${textColor}`}>#{rank}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <section className="border border-[#D9D9D933] w-full rounded-[30px] sm:rounded-[45px] bg-[#D9D9D933]/70 text-white overflow-hidden">
                <div className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[4rem_1fr_auto] gap-4 px-6 sm:px-10 py-4 border-b border-white/10 font-seravek text-sm text-white/50">
                    <span>{t('leaderboardRank')}</span>
                    <span>{t('leaderboardPlayer')}</span>
                    <span className="text-right pr-2">{t('leaderboardGamesWon')}</span>
                </div>

                {viewMode === 'friends' && players.length === 0 && !isLoading && (
                    <p className="px-6 sm:px-10 py-8 text-center font-seravek text-sm text-white/50">
                        {t('leaderboardNoFriends')}
                    </p>
                )}

                {isLoading && (
                    <p className="px-6 sm:px-10 py-8 text-center font-seravek text-sm text-white/50">Chargement...</p>
                )}
                {error && (
                    <p className="px-6 sm:px-10 py-8 text-center font-seravek text-sm text-red-300">{error}</p>
                )}

                {/* Rows */}
                <ul>
                    {players.map((player, index) => {
                        const rank = index + 1
                        const isCurrentUser = player.username === currentUsername
                        const rankColor = RANK_TEXT[rank] ?? 'text-white/80'
                        const resolvedAvatar = isCurrentUser ? currentAvatarUrl : player.avatarUrl

                        let rowClass = 'grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[4rem_1fr_auto] gap-4 items-center px-6 sm:px-10 py-4 border-b border-white/10 last:border-b-0 transition-colors hover:bg-white/5'
                        if (isCurrentUser) rowClass = 'grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[4rem_1fr_auto] gap-4 items-center px-6 sm:px-10 py-4 border-b border-white/10 last:border-b-0 bg-[#D4AF37]/10'

                        let avatarContent = <span>{player.username.charAt(0).toUpperCase()}</span>
                        if (resolvedAvatar) {
                            avatarContent = <img src={resolvedAvatar} alt={player.username} className="h-full w-full object-cover" />
                        }

                        return (
                            <li key={player.id} className={rowClass}>
                                <span className={`font-aeonik text-lg font-bold ${rankColor}`}>
                                    {rank}
                                </span>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D9D9D9] font-aeonik text-base text-[#1f2f37] overflow-hidden">
                                        {avatarContent}
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-seravek truncate">{player.username}</span>
                                        {isCurrentUser && (
                                            <span className="shrink-0 rounded-md border border-[#D4AF37] px-1.5 py-0.5 text-xs text-[#D4AF37]">
                                                {t('leaderboardYouLabel')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className={`font-seravek text-right pr-2 ${rankColor}`}>
                                    {player.gamesWon}
                                </span>
                            </li>
                        )
                    })}
                </ul>

                {currentUsername && !currentUserInList && (
                    <div className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[4rem_1fr_auto] gap-4 items-center px-6 sm:px-10 py-4 border-t-2 border-[#D4AF37]/30 bg-[#D4AF37]/5">
                        <span className="font-aeonik text-lg text-white/40">—</span>
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D9D9D9] font-aeonik text-base text-[#1f2f37] overflow-hidden">
                                {(() => {
                                    if (currentAvatarUrl) {
                                        return <img src={currentAvatarUrl} alt={currentUsername} className="h-full w-full object-cover" />
                                    }
                                    return <span>{currentUsername.charAt(0).toUpperCase()}</span>
                                })()}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-seravek">{currentUsername}</span>
                                <span className="shrink-0 rounded-md border border-[#D4AF37] px-1.5 py-0.5 text-xs text-[#D4AF37]">
                                    {t('leaderboardYouLabel')}
                                </span>
                            </div>
                        </div>
                        <span className="font-seravek text-right pr-2 text-white/50 text-sm">
                            {t('leaderboardNotRanked')}
                        </span>
                    </div>
                )}
            </section>
        </div>
    )
}

export default Leaderboard
