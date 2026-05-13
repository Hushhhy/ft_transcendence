import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { useWallet } from '../features/wallet/useWallet'
import { WalletTransactionOverlay } from '../features/wallet/WalletTransactionOverlay'

function Balance() {
    const { t } = useTranslation()
    const user = useAuthStore((state) => state.user)
    const { isLoading, error, lastTransaction, clearLastTransaction, handleDepositClick, handleCashoutClick } = useWallet()

    let displayedBalance = '0.00EUR'
    if (user && typeof user.balance === 'number') {
        displayedBalance = `${user.balance.toFixed(2)}EUR`
    }

    let depositLabel = t('depositActionDeposit')
    let cashoutLabel = t('depositActionWithdraw')
    if (isLoading) {
        depositLabel = '...'
        cashoutLabel = '...'
    }

    return (
        <div className="px-4 sm:px-6 lg:px-10">
            {lastTransaction && (
                <WalletTransactionOverlay
                    type={lastTransaction.type}
                    amount={lastTransaction.amount}
                    onDone={clearLastTransaction}
                />
            )}
            <header className="text-white mx-auto mt-8 sm:mt-15 w-full max-w-340 min-h-80 sm:min-h-150 border-2 border-[#D4AF37] rounded-[30px] sm:rounded-[61px] bg-[linear-gradient(180deg,rgba(35,119,63,0.4)_0%,rgba(1,39,14,1)_100%)] flex items-center justify-center py-10 sm:py-0">
                <div className="flex flex-col items-center justify-center text-center gap-8 sm:gap-10">
                    <div className="font-aeonik font-bold text-2xl sm:text-3xl">
                        <h1>{t('depositAvailableBalance')}</h1>
                        <h1>{displayedBalance}</h1>
                    </div>
                    <p className="font-seravek text-center text-white/50 text-sm">{t('depositPendingWithdrawal')}</p>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-5 font-seravek font-bold w-full px-6 sm:px-0">
                        <button onClick={handleDepositClick} disabled={isLoading} className="w-full sm:w-69.5 h-13 sm:h-15.75 border rounded-[15px] border-[#D4AF37] bg-[#D4AF37] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-500 ease-in-out hover:scale-[1.05] hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed">{depositLabel}</button>
                        <button onClick={handleCashoutClick} disabled={isLoading} className="w-full sm:w-69.5 h-13 sm:h-15.75 border-2 rounded-[15px] border-[#D4AF37] shadow-[0_12px_40px_rgba(1,1,1,1.35)] hover:bg-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed">{cashoutLabel}</button>
                    </div>
                </div>
            </header>
        </div>
    )
}

export default Balance