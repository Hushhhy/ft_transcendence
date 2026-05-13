import axios from 'axios'

type ApiErrorResponse = {
    message?: unknown
    errors?: Array<{ path?: unknown; message?: unknown }>
}

export const getAxiosErrorMessage = (error: unknown, fallback: string): string => {
    if (!axios.isAxiosError(error)) {
        if (error instanceof Error && error.message.trim()) {
            return error.message
        }
        return fallback
    }

    const responseData = error.response?.data as
        | { message?: unknown; errors?: Array<{ message?: unknown }> }
        | string
        | undefined

    if (typeof responseData === 'string' && responseData.trim()) {
        return responseData
    }

    if (responseData && typeof responseData === 'object') {
        if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
            const firstError = responseData.errors[0]
            if (typeof firstError?.message === 'string' && firstError.message.trim()) {
                return firstError.message
            }
        }

        if (typeof responseData.message === 'string' && responseData.message.trim()) {
            return responseData.message
        }
    }

    if (typeof error.message === 'string' && error.message.trim()) {
        return error.message
    }

    return fallback
}

export const getApiFieldErrors = (error: unknown): Record<string, string> => {
    const fieldErrors: Record<string, string> = {}
    if (!axios.isAxiosError(error)) {
        return fieldErrors
    }

    const responseData = error.response?.data as ApiErrorResponse | string | undefined
    if (!responseData || typeof responseData !== 'object' || !Array.isArray(responseData.errors)) {
        return fieldErrors
    }

    responseData.errors.forEach((item) => {
        if (!item || typeof item !== 'object') return
        let path = ''
        if (typeof item.path === 'string') path = item.path
        let message = ''
        if (typeof item.message === 'string') message = item.message
        if (path && message) {
            fieldErrors[path] = message
        }
    })

    return fieldErrors
}
