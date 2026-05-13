import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { useFriendsPage } from '../features/friends/useFriendsPage'

type Tab = 'friends' | 'pending' | 'sent'

function AvatarCircle({ avatarUrl, username }: { avatarUrl: string | null; username: string }) {
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D9D9D9] text-sm font-aeonik text-[#1f2f37] overflow-hidden">
            {avatarUrl
                ? <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
                : username.charAt(0).toUpperCase()}
        </div>
    )
}

function Friends() {
    const { t } = useTranslation()
    const user = useAuthStore((state) => state.user)
    const [activeTab, setActiveTab] = useState<Tab>('friends')

    const {
        friends,
        pendingRequests,
        sentRequests,
        loading,
        removeFriend,
        acceptRequest,
        declineRequest,
    } = useFriendsPage()

    if (!user) return <Navigate to="/Login" replace />

    const tabs: { key: Tab; label: string; badge?: number }[] = [
        { key: 'friends', label: t('friendsTabFriends') },
        { key: 'pending', label: t('friendsTabPending'), badge: pendingRequests.length > 0 ? pendingRequests.length : undefined },
        { key: 'sent', label: t('friendsTabSent') },
    ]

    return (
        <div className="w-full px-4 sm:px-6 lg:px-10 max-w-362 mx-auto flex flex-col gap-5">
            <section className="border border-[#D9D9D933] w-full rounded-[30px] sm:rounded-[45px] bg-[#D9D9D933]/70 text-white pb-8">
                <div className="mt-5 px-6 sm:px-10 lg:px-25">
                    <h1 className="font-aeonik text-2xl">{t('friendsPageTitle')}</h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 mt-6 px-6 sm:px-10 lg:px-25 border-b border-white/10">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`pb-3 font-seravek text-sm transition cursor-pointer relative flex items-center gap-2 ${activeTab === tab.key ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                        >
                            {tab.label}
                            {tab.badge !== undefined && (
                                <span className="h-5 min-w-5 rounded-full bg-[#D4AF37] text-[#1f2f37] text-xs flex items-center justify-center px-1 font-aeonik">
                                    {tab.badge}
                                </span>
                            )}
                            {activeTab === tab.key && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="px-6 sm:px-10 lg:px-25 pt-6">
                    {loading ? (
                        <p className="text-sm text-white/40">{t('friendsLoading')}</p>
                    ) : (
                        <>
                            {/* ─── Amis ─── */}
                            {activeTab === 'friends' && (
                                <ul className="space-y-3">
                                    {friends.length === 0 ? (
                                        <p className="text-sm text-white/50">{t('friendsEmpty')}</p>
                                    ) : (
                                        friends.map((friend) => (
                                            <li key={friend.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <AvatarCircle avatarUrl={friend.avatarUrl} username={friend.username} />
                                                        {friend.isOnline && (
                                                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-[#1a2a32]" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-seravek">{friend.username}</p>
                                                        <p className="text-xs text-white/40">
                                                            {friend.isOnline
                                                                ? t('friendsOnline')
                                                                : friend.lastSeen
                                                                    ? new Date(friend.lastSeen).toLocaleDateString('fr-FR')
                                                                    : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => removeFriend(friend.id)}
                                                        className="text-xs font-seravek text-white/40 hover:text-red-400 transition cursor-pointer px-2 py-1 rounded border border-white/10 hover:border-red-400/30"
                                                    >
                                                        {t('friendsRemove')}
                                                    </button>
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}

                            {/* ─── Demandes reçues ─── */}
                            {activeTab === 'pending' && (
                                <ul className="space-y-3">
                                    {pendingRequests.length === 0 ? (
                                        <p className="text-sm text-white/50">{t('friendsPendingEmpty')}</p>
                                    ) : (
                                        pendingRequests.map((req) => (
                                            <li key={req.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <AvatarCircle avatarUrl={req.requester.avatarUrl} username={req.requester.username} />
                                                    <p className="text-sm font-seravek">{req.requester.username}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => acceptRequest(req.id)}
                                                        className="text-xs font-seravek px-3 py-1 rounded border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 transition cursor-pointer"
                                                    >
                                                        {t('friendsAccept')}
                                                    </button>
                                                    <button
                                                        onClick={() => declineRequest(req.id)}
                                                        className="text-xs font-seravek px-3 py-1 rounded border border-white/20 text-white/50 hover:text-white/80 hover:border-white/40 transition cursor-pointer"
                                                    >
                                                        {t('friendsDecline')}
                                                    </button>
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}

                            {/* ─── Demandes envoyées ─── */}
                            {activeTab === 'sent' && (
                                <ul className="space-y-3">
                                    {sentRequests.length === 0 ? (
                                        <p className="text-sm text-white/50">{t('friendsSentEmpty')}</p>
                                    ) : (
                                        sentRequests.map((req) => (
                                            <li key={req.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <AvatarCircle avatarUrl={req.addressee.avatarUrl} username={req.addressee.username} />
                                                    <p className="text-sm font-seravek">{req.addressee.username}</p>
                                                </div>
                                                <p className="text-xs text-white/40 font-seravek">{t('friendsRequestPending')}</p>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    )
}

export default Friends
