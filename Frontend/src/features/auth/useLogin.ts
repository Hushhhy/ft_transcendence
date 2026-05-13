import { useState } from 'react'
import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { getAxiosErrorMessage, getApiFieldErrors } from '../../lib/axiosError'

const getMaxBirthDate = (): string => {
    const today = new Date()
    const year = today.getFullYear() - 18
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const isAtLeast18 = (birthDateValue: string): boolean => {
    let birthDate: Date
    if (/^\d{4}-\d{2}-\d{2}$/.test(birthDateValue)) {
        const [year, month, day] = birthDateValue.split('-').map(Number)
        birthDate = new Date(year, month - 1, day)
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(birthDateValue)) {
        const [day, month, year] = birthDateValue.split('/').map(Number)
        birthDate = new Date(year, month - 1, day)
    } else {
        birthDate = new Date('invalid')
    }

    if (Number.isNaN(birthDate.getTime())) {
        return false
    }

    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age -= 1
    }

    return age >= 18
}

export function useLogin() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const setUser = useAuthStore((state) => state.setUser)

    const [loginErrors, setLoginErrors] = useState<Record<string, string>>({})
    const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({})
    const [loginServerMessage, setLoginServerMessage] = useState('')
    const [registerServerMessage, setRegisterServerMessage] = useState('')
    const [isLoginLoading, setIsLoginLoading] = useState(false)
    const [isRegisterLoading, setIsRegisterLoading] = useState(false)
    const [isLoginPasswordVisible, setIsLoginPasswordVisible] = useState(false)
    const [isRegisterPasswordVisible, setIsRegisterPasswordVisible] = useState(false)
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)

    const maxBirthDate = getMaxBirthDate()

    const validateForm = (form: HTMLFormElement): Record<string, string> => {
        const errors: Record<string, string> = {}
        const requiredInputs = form.querySelectorAll('input[required]')
        requiredInputs.forEach((node) => {
            const input = node as HTMLInputElement
            const fieldName = input.name
            if (input.type === 'checkbox' && !input.checked) {
                errors[fieldName] = t('checkboxRequiredError')
                return
            }
            if (input.value.trim() === '') {
                errors[fieldName] = t('requiredFieldError')
                return
            }
            if (fieldName === 'birthDate' && !isAtLeast18(input.value)) {
                errors[fieldName] = t('mustBeAdultError')
                return
            }
            if (fieldName === 'password' && input.value.trim().length < 8) {
                errors[fieldName] = t('passwordRule')
                return
            }
            if (fieldName === 'password') {
                const password = input.value.trim()
                if (!/[0-9]/.test(password)) {
                    errors[fieldName] = t('passwordNumberRule')
                    return
                }
                if (!/[!@#$%^&*]/.test(password)) {
                    errors[fieldName] = t('passwordSpecialRule')
                    return
                }
                if (!/[A-Z]/.test(password)) {
                    errors[fieldName] = t('passwordUppercaseRule')
                    return
                }
                if (!/[a-z]/.test(password)) {
                    errors[fieldName] = t('passwordLowercaseRule')
                    return
                }
            }
            if (input.type === 'email' && !input.validity.valid) {
                errors[fieldName] = t('invalidEmailError')
            }
        })
        return errors
    }

    const clearFieldError = (
        field: string,
        setErrors: Dispatch<SetStateAction<Record<string, string>>>
    ) => {
        setErrors((prev) => {
            if (!prev[field]) return prev
            const next = { ...prev }
            delete next[field]
            return next
        })
    }

    const clearLoginFieldError = (field: string) => {
        clearFieldError(field, setLoginErrors)
        setLoginServerMessage('')
    }

    const clearRegisterFieldError = (field: string) => {
        clearFieldError(field, setRegisterErrors)
        setRegisterServerMessage('')
    }

    const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const errors = validateForm(event.currentTarget)
        setLoginErrors(errors)
        setLoginServerMessage('')
        if (Object.keys(errors).length > 0) return

        const formData = new FormData(event.currentTarget)
        const email = String(formData.get('email') ?? '').trim()
        const password = String(formData.get('password') ?? '').trim()

        try {
            setIsLoginLoading(true)
            const response = await axios.post('/api/auth/login', { email, password })
            const payload = response.data?.data

            if (payload) {
                let balance = 0
                if (typeof payload.balance === 'number') {
                    balance = payload.balance
                }

                let birthDate: string | null = null
                if (typeof payload.birthDate === 'string') {
                    birthDate = payload.birthDate
                }

                setUser({
                    id: payload.id,
                    email: payload.email,
                    username: payload.username,
                    birthDate,
                    avatarUrl: payload.avatarUrl ?? null,
                    verified: Boolean(payload.verified),
                    balance,
                    createdAt: String(payload.createdAt ?? ''),
                    token: String(payload.token ?? ''),
                })
            }

            setLoginServerMessage('Connexion reussie.')
            navigate('/Account')
        } catch (error) {
            setLoginServerMessage(
                getAxiosErrorMessage(error, 'Erreur lors de la connexion.')
            )
        } finally {
            setIsLoginLoading(false)
        }
    }

    const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const form = event.currentTarget
        const errors = validateForm(form)
        setRegisterErrors(errors)
        setRegisterServerMessage('')
        if (Object.keys(errors).length > 0) return

        const formData = new FormData(form)
        const username = String(formData.get('username') ?? '').trim()

        const payload = {
            email: String(formData.get('email') ?? '').trim(),
            username,
            password: String(formData.get('password') ?? '').trim(),
            confirmPassword: String(formData.get('confirmPassword') ?? '').trim(),
            birthDate: String(formData.get('birthDate') ?? '').trim(),
            avatarUrl: '',
        }

        try {
            setIsRegisterLoading(true)
            await axios.post('/api/auth/signup', payload)
            setRegisterServerMessage('Compte cree. Verifie ton email.')
            form.reset()
            setRegisterErrors({})
        } catch (error) {
            const apiFieldErrors = getApiFieldErrors(error)
            if (Object.keys(apiFieldErrors).length > 0) {
                setRegisterErrors((prev) => ({ ...prev, ...apiFieldErrors }))
            }
            setRegisterServerMessage(
                getAxiosErrorMessage(error, 'Erreur lors de la creation du compte.')
            )
        } finally {
            setIsRegisterLoading(false)
        }
    }

    return {
        loginErrors,
        registerErrors,
        loginServerMessage,
        registerServerMessage,
        isLoginLoading,
        isRegisterLoading,
        isLoginPasswordVisible,
        setIsLoginPasswordVisible,
        isRegisterPasswordVisible,
        setIsRegisterPasswordVisible,
        isConfirmPasswordVisible,
        setIsConfirmPasswordVisible,
        maxBirthDate,
        clearLoginFieldError,
        clearRegisterFieldError,
        handleLoginSubmit,
        handleRegisterSubmit,
    }
}
