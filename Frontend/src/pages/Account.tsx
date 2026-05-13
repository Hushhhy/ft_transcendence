import { useAuthStore } from '../stores/authStore'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAccountProfile } from '../features/account/useAccountProfile'
import { useAccountFriends } from '../features/account/useAccountFriends'
import { useAccountBlackjackStats } from '../features/account/useAccountBlackjackStats'

function formatBirthDateForDisplay(value: string | null | undefined): string {
    if (!value || !value.trim()) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('fr-FR')
}

function formatNetAmount(value: number): string {
    const absolute = Math.abs(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `${value > 0 ? '+' : value < 0 ? '-' : ''}${absolute} EUR`
}

function formatRoundCause(value: string): string {
    switch (value) {
        case 'bust':
            return 'Bust'
        case 'victory':
            return 'Victoire'
        case 'defeat':
            return 'Défaite'
        case 'blackjack':
            return 'Blackjack'
        case 'push':
            return 'Push'
        default:
            return value
    }
}

function Account() {
    const { t } = useTranslation()
    const user = useAuthStore((state) => state.user)
    const clearUser = useAuthStore((state) => state.clearUser)
    const navigate = useNavigate()

    const {
        isEditingUsername,
        usernameDraft,
        setUsernameDraft,
        avatarMessage,
        fileInputRef,
        handleSaveUsername,
        handleUsernameEditAction,
        handleUsernameEditKeyDown,
        handleUsernameInputKeyDown,
        handleAvatarClick,
        handleAvatarKeyDown,
        handleAvatarFileChange,
    } = useAccountProfile()

    const {
        friendsList,
        friendInput,
        setFriendInput,
        friendError,
        setFriendError,
        friendSuccess,
        isSubmitting,
        handleAddFriend,
    } = useAccountFriends()

    const {
        stats: blackjackStats,
        isLoading: isBlackjackStatsLoading,
        error: blackjackStatsError,
    } = useAccountBlackjackStats()

    if (!user) {
        return <Navigate to="/Login" replace />
    }

    const displayedUsername = user.username
    const displayedEmail = user.email ?? '-'
    const displayedAvatarUrl = user.avatarUrl ?? null
    const displayedBirthDate = formatBirthDateForDisplay(user.birthDate)
    const avatarFallbackLetter = displayedUsername.trim().charAt(0).toUpperCase() || 'U'

    let displayedBalance = '0,00 EUR'
    if (typeof user.balance === 'number') {
        displayedBalance = `${user.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`
    }

    const handleSignOut = () => {
        clearUser()
        navigate('/Login', { replace: true })
    }

return (
        <div className="w-full px-4 sm:px-6 lg:px-10 max-w-362 mx-auto flex flex-col gap-5">
            <section className="border border-[#D9D9D933] w-full rounded-[30px] sm:rounded-[45px] bg-[#D9D9D933]/70 text-white">
                <div className="flex items-center justify-between text-white mt-5 px-6 sm:px-10 lg:px-25">
                    <h1 className="font-aeonik text-2xl">{t('accountProfileTitle')}</h1>
                    <img src="/sign-out.svg" alt="Sign-out" className="cursor-pointer" role="button" tabIndex={0} onClick={handleSignOut} />
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mt-6 sm:mt-10 px-6 sm:pl-30 sm:pr-8 pb-8">
                    <div
                        className="group relative w-32 h-32 sm:w-56.5 sm:h-56.5 shrink-0 rounded-full overflow-hidden border border-white/30 bg-[#D9D9D9] flex items-center justify-center text-4xl sm:text-6xl font-aeonik text-[#1f2f37] cursor-pointer"
                        role="button" tabIndex={0} onClick={handleAvatarClick} onKeyDown={handleAvatarKeyDown}>
                        {displayedAvatarUrl && <img src={displayedAvatarUrl} alt="Avatar" className="h-full w-full object-cover" />}
                        {!displayedAvatarUrl && <span>{avatarFallbackLetter}</span>}
                        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/35 text-sm font-seravek text-white group-hover:flex">
                            {t('accountChangePhoto')}
                        </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarFileChange} />
                    <div className="w-full sm:flex-1 sm:ml-15">
                        <div className="sm:mt-5">
                            <div className="flex items-center gap-4">
                                {isEditingUsername ? (
                                    <input type="text" value={usernameDraft} onChange={(event) => setUsernameDraft(event.target.value)} onKeyDown={handleUsernameInputKeyDown}
                                        className="font-aeonik text-xl h-10 w-full sm:w-60 rounded-xl border border-white/55 bg-transparent px-3 text-white focus:border-[#d4af37] focus:outline-none"
                                        onBlur={handleSaveUsername} autoFocus />)
                                        : ( <h1 className="font-aeonik text-xl">{displayedUsername}</h1> )}
                                <img src="/edit.svg" alt="Modifier profil" className="w-6 h-6 cursor-pointer" role="button" tabIndex={0} onClick={handleUsernameEditAction} onKeyDown={handleUsernameEditKeyDown}/>
                            </div>
                            <p className="mt-3 text-sm text-[#d4af37] min-h-5"> {avatarMessage} </p>
                        </div>
                        <div className="font-seravek flex flex-wrap gap-8 sm:gap-12 lg:gap-30 mt-8 sm:mt-12">
                            <div>
                                <p className="text-white/50">{t('birthDateLabel')}</p>
                                <p className="mt-5">{displayedBirthDate}</p>
                            </div>
                            <div>
                                <p className="text-white/50">{t('emailLabel')}</p>
                                <p className="mt-5">{displayedEmail}</p>
                            </div>
                            <div>
                                <p className="text-white/50">Rang</p>
                                <Link to="/Leaderboard" className="mt-5 block text-white/50 hover:text-white/80 transition text-sm">
                                    {t('leaderboardNotRanked')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="border border-[#D9D9D933] w-full rounded-[30px] sm:rounded-[45px] bg-[#D9D9D933]/70 text-white pb-8">
                <div className="flex items-center justify-between text-white mt-5 px-6 sm:px-10 lg:px-25">
                    <h1 className="font-aeonik text-2xl">{t('accountOthersTitle')}</h1>
                    <h1 className='border rounded-lg w-25 h-7 text-center bg-green-600'>{t('accountOnline')}</h1>
                </div>
                <div className='flex flex-col sm:flex-row mt-6 sm:mt-10 px-4 sm:px-20 gap-5'>
                    <div className='border border-[#D9D9D933] rounded-[30px] w-full sm:flex-1 min-h-50 bg-[#D9D9D933]/70'>
                        <div className='flex ml-7 mt-5'>
                            <img src="/statistiques.svg" alt="stats" className='size-7'/>
                            <h1 className='font-aeonik text-xl ml-3'>{t('accountStatistics')}</h1>
                        </div>
                        <div className='mx-7 my-6 border-t border-[#D4AF37]' />
                        <div className='px-7 pb-6 font-seravek text-sm text-white/80'>
                            {isBlackjackStatsLoading ? (
                                <p className='text-white/50 py-3'>Chargement...</p>
                            ) : (
                                <>
                                    <div className='flex items-center justify-between gap-4 py-3'>
                                        <span>{t('accountStatsManchesJouees')}</span>
                                        <span className='text-white'>{blackjackStats?.gamesPlayed ?? 0}</span>
                                    </div>
                                    <div className='border-t border-white/15' />
                                    <div className='flex items-center justify-between gap-4 py-3'>
                                        <span>{t('accountStatsPlusGrosGain')}</span>
                                        <span className='text-white'>{(blackjackStats?.bestGainAmount ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                    </div>
                                    <div className='border-t border-white/15' />
                                    <div className='flex items-center justify-between gap-4 py-3'>
                                        <span>{t('accountStatsPlusGrossePerte')}</span>
                                        <span className='text-white'>{(blackjackStats?.bestLossAmount ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                    </div>
                                    <div className='border-t border-white/15' />
                                    <div className='flex items-center justify-between gap-4 py-3'>
                                        <span>Balance</span>
                                        <span className='text-white'>{(blackjackStats?.totalBalance ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                                    </div>
                                </>
                            )}
                            {blackjackStatsError && <p className='text-xs text-red-300'>{blackjackStatsError}</p>}
                        </div>
                    </div>
                    <div className='border border-[#D9D9D933] rounded-[30px] w-full sm:flex-1 min-h-50 bg-[#D9D9D933]/70'>
                        <div className='flex ml-7 mt-5'>
                            <img src="/balance.svg" alt="balance" className='size-7'/>
                            <h1 className='font-aeonik text-xl ml-3'>{t('accountSoldeTitle')}</h1>
                        </div>
                        <div className='mx-7 my-6 border-t border-[#D4AF37]' />
                        <div className='flex justify-between mx-7 -mt-4'>
                            <p className='font-seravek text-sm text-white/70'>{t('accountAvailableBalance')}</p>
                            <p className='font-seravek text-sm text-white/70'>{displayedBalance}</p>
                        </div>
                        <Link to="/Deposit">
                            <button className="mx-auto block mt-5 w-50 h-10 border rounded-[10px] border-[#D4AF37] hover:bg-white/15 transition cursor-pointer">{t('depositActionDeposit')}</button>
                        </Link>
                    </div>
                    <div className='border border-[#D9D9D933] rounded-[30px] w-full sm:flex-1 bg-[#D9D9D933]/70'>
                        <div className='flex ml-7 mt-5'>
                            <img src="/friends.svg" alt="friends" className='size-7'/>
                            <h1 className='font-aeonik text-xl ml-3'>{t('accountFriends')}</h1>
                        </div>
                        <div className='mx-7 my-4 border-t border-[#D4AF37]' />
                        <div className='px-7 pb-6'>
                            <div className='flex gap-2'>
                                <input
                                    type="text"
                                    value={friendInput}
                                    onChange={(e) => { setFriendInput(e.target.value); setFriendError('') }}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !isSubmitting) handleAddFriend() }}
                                    placeholder={t('friendsSearchPlaceholder')}
                                    className="flex-1 h-9 rounded-lg border border-white/30 bg-transparent px-3 text-sm text-white placeholder:text-white/35 focus:border-[#d4af37] focus:outline-none"
                                />
                                <button
                                    onClick={handleAddFriend}
                                    disabled={isSubmitting}
                                    className='h-9 px-4 rounded-lg border border-[#D4AF37] text-sm font-seravek hover:bg-white/15 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    {t('friendsAdd')}
                                </button>
                            </div>
                            {friendError && <p className='mt-1 text-xs text-red-300'>{friendError}</p>}
                            {friendSuccess && <p className='mt-1 text-xs text-green-300'>{friendSuccess}</p>}
                            <ul className='mt-3 space-y-2 max-h-40 overflow-y-auto'>
                                {friendsList.length === 0 ? (
                                    <p className='text-sm text-white/50'>{t('friendsEmpty')}</p>
                                ) : (
                                    friendsList.map((friend) => (
                                        <li key={friend.id} className='flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2'>
                                            <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D9D9D9] text-sm font-aeonik text-[#1f2f37] overflow-hidden'>
                                                {friend.avatarUrl ? (
                                                    <img src={friend.avatarUrl} alt={friend.username} className='h-full w-full object-cover' />
                                                ) : (
                                                    friend.username.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <span className='text-sm font-seravek'>{friend.username}</span>
                                            {friend.isOnline && <span className='h-2 w-2 rounded-full bg-green-400' />}
                                        </li>
                                    ))
                                )}
                            </ul>
                            <Link
                                to="/Friends"
                                className='mt-4 block text-right text-xs font-seravek text-[#D4AF37] hover:text-white/70 transition'
                            >
                                {t('friendsViewAll')} →
                            </Link>
                        </div>
                    </div>
                </div>
                <div className='border border-[#D9D9D933] rounded-[30px] mt-6 sm:mt-10 mx-4 sm:mx-20 min-h-50 bg-[#D9D9D933]/70'>
                    <div className='flex ml-7 mt-5'>
                        <img src="/history.svg" alt="history" className='size-7' />
                        <h1 className='font-aeonik text-xl ml-3'>{t('accountHistory')}</h1>
                    </div>
                    <div className='mx-7 my-4 border-t border-[#D4AF37]' />
                    <div className='px-7 pb-6'>
                        {isBlackjackStatsLoading ? (
                            <p className='text-sm text-white/50'>Chargement de l’historique blackjack...</p>
                        ) : blackjackStats?.recentRounds.length ? (
                            <ul className='space-y-2'>
                                {blackjackStats.recentRounds.map((round) => (
                                    <li key={round.id} className='flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm font-seravek'>
                                        <div>
                                            <p className='text-white'>{formatRoundCause(round.cause)}</p>
                                            <p className='text-xs text-white/45'>{new Date(round.createdAt).toLocaleString('fr-FR')}</p>
                                        </div>
                                        <span className={round.netAmount >= 0 ? 'text-green-300' : 'text-red-300'}>
                                            {formatNetAmount(round.netAmount)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className='text-sm text-white/50'>Aucune manche blackjack enregistrée pour le moment.</p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Account