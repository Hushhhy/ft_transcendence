import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { getAxiosErrorMessage } from '../../lib/axiosError'

export function useForgotPwd() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const resetToken = (searchParams.get('token') || '').trim()
    const hasResetToken = resetToken.length > 0
    const [email, setEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [emailError, setEmailError] = useState('')
    const [resetError, setResetError] = useState('')
    const [serverMessage, setServerMessage] = useState('')
    const [isSendingCode, setIsSendingCode] = useState(false)
    const [isResetting, setIsResetting] = useState(false)

    const validateEmail = (value: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    }

    const validatePassword = (value: string): string => {
        if (value.length < 8) return t('forgotPwdPasswordMinLength')
        if (!/[0-9]/.test(value)) return t('forgotPwdPasswordNumber')
        if (!/[!@#$%^&*]/.test(value)) return t('forgotPwdPasswordSpecial')
        if (!/[A-Z]/.test(value)) return t('forgotPwdPasswordUppercase')
        if (!/[a-z]/.test(value)) return t('forgotPwdPasswordLowercase')
        return ''
    }

    const handleRequestCode = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setEmailError('')
        setServerMessage('')

        const normalizedEmail = email.trim()
        if (!normalizedEmail) {
            setEmailError(t('forgotPwdEmailRequired'))
            return
        }

        if (!validateEmail(normalizedEmail)) {
            setEmailError(t('invalidEmailError'))
            return
        }

        try {
            setIsSendingCode(true)
            await axios.post('/api/auth/forgot-password', { email: normalizedEmail })
            setServerMessage(t('forgotPwdCodeSentMessage'))
        } catch (error) {
            setServerMessage(getAxiosErrorMessage(error, t('forgotPwdSendError')))
        } finally {
            setIsSendingCode(false)
        }
    }

    const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setResetError('')
        setServerMessage('')
        const passwordValidationError = validatePassword(newPassword)

        if (!hasResetToken) {
            setResetError(t('forgotPwdCodeRequired'))
            return
        }

        if (passwordValidationError) {
            setResetError(passwordValidationError)
            return
        }

        if (newPassword !== confirmPassword) {
            setResetError(t('forgotPwdPasswordMismatch'))
            return
        }

        try {
            setIsResetting(true)
            await axios.post('/api/auth/reset-password', {
                token: resetToken,
                newPassword,
                confirmPassword,
            })
            setServerMessage(t('forgotPwdSuccessMessage'))
            setTimeout(() => navigate('/Login'), 1200)
        } catch (error) {
            setServerMessage(getAxiosErrorMessage(error, t('forgotPwdResetError')))
        } finally {
            setIsResetting(false)
        }
    }

    return {
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
    }
}
