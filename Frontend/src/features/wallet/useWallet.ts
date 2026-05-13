import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import api from '../../lib/api'
import type { WalletTransactionType } from './WalletTransactionOverlay'

type LastTransaction = { type: WalletTransactionType; amount: number } | null

export function useWallet() {
    const { t } = useTranslation()
    const user = useAuthStore((state) => state.user)
    const setUser = useAuthStore((state) => state.setUser)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [lastTransaction, setLastTransaction] = useState<LastTransaction>(null)

    const handleDepositClick = async () => {
        if (!user || isLoading) return
        setError('')
        setIsLoading(true)
        try {
            const res = await api.post<{ status: string; data: { balance: number } }>('/wallet/deposit')
            if (res.data.status === 'success') {
                const prev = user.balance ?? 0
                setUser({ ...user, balance: res.data.data.balance })
                setLastTransaction({ type: 'deposit', amount: res.data.data.balance - prev })
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            setError(msg ?? t('depositError'))
        } finally {
            setIsLoading(false)
        }
    }

    const handleCashoutClick = async () => {
        if (!user || isLoading) return
        setError('')
        setIsLoading(true)
        try {
            const res = await api.post<{ status: string; data: { balance: number } }>('/wallet/cashout')
            if (res.data.status === 'success') {
                const prev = user.balance ?? 0
                setUser({ ...user, balance: res.data.data.balance })
                setLastTransaction({ type: 'cashout', amount: prev - res.data.data.balance })
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            setError(msg ?? t('depositError'))
        } finally {
            setIsLoading(false)
        }
    }

    return { isLoading, error, lastTransaction, clearLastTransaction: () => setLastTransaction(null), handleDepositClick, handleCashoutClick }
}
