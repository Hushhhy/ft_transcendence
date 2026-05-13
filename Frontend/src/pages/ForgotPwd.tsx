import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForgotPwd } from '../features/auth/useForgotPwd'

function ForgotPwd() {
    const { t } = useTranslation()
    const {
        hasResetToken,
        email, setEmail,
        newPassword, setNewPassword,
        confirmPassword, setConfirmPassword,
        emailError, setEmailError,
        resetError, setResetError,
        serverMessage, setServerMessage,
        isSendingCode,
        isResetting,
        handleRequestCode,
        handleResetPassword,
    } = useForgotPwd()

    return (
        <section className="mx-auto flex h-200 w-full max-w-7xl items-center justify-center px-6 py-12 text-white md:px-10 lg:px-16">
            <div className="w-full max-w-120 rounded-2xl border border-white/20 bg-white/5 p-8 backdrop-blur-sm">
                <h1 className="text-center font-aeonik text-2xl">{t('forgotPwdTitle')}</h1>
                <p className="mt-2 text-center font-seravek text-sm text-white/70">
                    {hasResetToken
                        ? t('forgotPwdSubtitleWithCode')
                        : t('forgotPwdSubtitleNoCode')}
                </p>

                {!hasResetToken ? (
                    <form className="mt-8 space-y-4" onSubmit={handleRequestCode} noValidate>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="forgot-email" className="text-[1.02rem] text-white/85">{t('emailLabel')}</label>
                            <input
                                id="forgot-email"
                                type="email"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value)
                                    setEmailError('')
                                    setServerMessage('')
                                }}
                                placeholder={t('forgotPwdEmailPlaceholder')}
                                className="h-11 rounded-xl border border-white/55 bg-transparent px-5 text-white placeholder:text-white/35 focus:border-[#d4af37] focus:outline-none"
                                required
                            />
                            <p className="min-h-4 text-xs text-red-300">{emailError}</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isSendingCode}
                            className="mx-auto block h-12 w-full max-w-60 rounded-xl border-2 border-[#d4af37] bg-transparent font-aeonik text-lg font-bold text-white transition hover:bg-[#d4af37]/10 disabled:opacity-70"
                        >
                            {isSendingCode && '...'}
                            {!isSendingCode && t('forgotPwdSendCode')}
                        </button>
                    </form>
                ) : (
                    <form className="mt-8 space-y-4" onSubmit={handleResetPassword} noValidate>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="new-password" className="text-[1.02rem] text-white/85">{t('forgotPwdNewPasswordLabel')}</label>
                            <input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(event) => {
                                    setNewPassword(event.target.value)
                                    setResetError('')
                                    setServerMessage('')
                                }}
                                placeholder="********"
                                className="h-11 rounded-xl border border-white/55 bg-transparent px-5 text-white placeholder:text-white/35 focus:border-[#d4af37] focus:outline-none"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="confirm-new-password" className="text-[1.02rem] text-white/85">{t('confirmPasswordLabel')}</label>
                            <input
                                id="confirm-new-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => {
                                    setConfirmPassword(event.target.value)
                                    setResetError('')
                                    setServerMessage('')
                                }}
                                placeholder="********"
                                className="h-11 rounded-xl border border-white/55 bg-transparent px-5 text-white placeholder:text-white/35 focus:border-[#d4af37] focus:outline-none"
                                required
                            />
                            <p className="min-h-4 text-xs text-red-300">{resetError}</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isResetting}
                            className="mx-auto block h-12 w-full max-w-72 rounded-xl border-2 border-[#d4af37] bg-transparent font-aeonik text-lg font-bold text-white transition hover:bg-[#d4af37]/10 disabled:opacity-70"
                        >
                            {isResetting && '...'}
                            {!isResetting && t('forgotPwdChangePassword')}
                        </button>
                    </form>
                )}

                <p className="mt-4 min-h-4 text-center text-sm text-[#d4af37]">{serverMessage}</p>

                <div className="mt-5 text-center text-sm text-white/75">
                    <Link to="/Login" className="underline hover:text-white">{t('forgotPwdBackToLogin')}</Link>
                </div>
            </div>
        </section>
    )
}

export default ForgotPwd