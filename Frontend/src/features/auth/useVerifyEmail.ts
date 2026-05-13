import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { getAxiosErrorMessage } from '../../lib/axiosError'

type VerifyState = 'loading' | 'success' | 'error'

export function useVerifyEmail() {
    const { t } = useTranslation()
    const [searchParams] = useSearchParams()
    const [status, setStatus] = useState<VerifyState>('loading')
    const [message, setMessage] = useState(t('verifyEmailLoading'))
    const hasVerifiedRef = useRef(false)

    useEffect(() => {
        if (hasVerifiedRef.current) {
            return
        }
        hasVerifiedRef.current = true

        const token = searchParams.get('token')

        if (!token || !token.trim()) {
            setStatus('error')
            setMessage(t('verifyEmailTokenMissing'))
            return
        }

        const verify = async () => {
            try {
                await axios.post('/api/auth/verify-email', { token })
                setStatus('success')
                setMessage(t('verifyEmailSuccess'))
            } catch (error) {
                setStatus('error')
                setMessage(getAxiosErrorMessage(error, t('verifyEmailError')))
            }
        }

        void verify()
    }, [searchParams])

    return { status, message }
}
