import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useVerifyEmail } from '../features/auth/useVerifyEmail'

function VerifyEmail() {
  const { t } = useTranslation()
  const { status, message } = useVerifyEmail()

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center justify-center px-6 py-12 text-white md:px-10 lg:px-16">
      <div className="w-full max-w-120 rounded-2xl border border-white/20 bg-white/5 p-8 text-center backdrop-blur-sm">
        <h1 className="font-aeonik text-2xl">{t('verifyEmailTitle')}</h1>

        {status === 'loading' && (
          <p className="mt-6 font-seravek text-white/80">{message}</p>
        )}

        {status === 'success' && (
          <>
            <p className="mt-6 font-seravek text-green-300">{message}</p>
            <Link
              to="/Login"
              className="mx-auto mt-8 block h-12 w-full max-w-72 rounded-xl border-2 border-[#d4af37] bg-transparent px-6 py-2 font-aeonik text-lg font-bold text-white transition hover:bg-[#d4af37]/10"
            >
              {t('verifyEmailGoToLogin')}
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="mt-6 font-seravek text-red-300">{message}</p>
            <Link
              to="/Login"
              className="mx-auto mt-8 block h-12 w-full max-w-72 rounded-xl border-2 border-[#d4af37] bg-transparent px-6 py-2 font-aeonik text-lg font-bold text-white transition hover:bg-[#d4af37]/10"
            >
              {t('verifyEmailBackToLogin')}
            </Link>
          </>
        )}
      </div>
    </section>
  )
}

export default VerifyEmail
