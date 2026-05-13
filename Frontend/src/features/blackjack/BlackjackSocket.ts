import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import type {
    BlackjackActionPayload,
    BlackjackErrorPayload,
    BlackjackJoinPayload,
    BlackjackPlaceBetPayload,
    BlackjackTableStatePayload,
    BlackjackRoundResultPayload,
    BlackjackWalletUpdatePayload,
    BlackjackJoinedPendingPayload,
} from './types'

type UseBlackjackSocketOptions = {
    enabled: boolean
    token?: string
    onError?: (payload: BlackjackErrorPayload) => void
    onTableState?: (payload: BlackjackTableStatePayload) => void
    onRoundResult?: (payload: BlackjackRoundResultPayload) => void
    onWalletUpdate?: (payload: BlackjackWalletUpdatePayload) => void
    onJoinedPending?: (payload: BlackjackJoinedPendingPayload) => void
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

const resolveSocketUrl = (): string => {
    const browserOrigin = typeof window !== 'undefined' ? window.location.origin : undefined
    const envUrl = import.meta.env.VITE_WS_URL as string | undefined

    if (envUrl && envUrl.trim().length > 0) {
        if (browserOrigin) {
            try {
                const resolved = new URL(envUrl, browserOrigin)

                if (window.location.protocol === 'https:' && resolved.protocol === 'http:') {
                    resolved.protocol = 'https:'
                    if (resolved.port === '8080' && window.location.port === '8443') {
                        resolved.port = '8443'
                    }
                }

                return resolved.origin
            } catch {
                return browserOrigin
            }
        }

        return envUrl
    }
    if (browserOrigin) {
        return browserOrigin
    }

    return 'http://localhost:3000'
}

export const useBlackjackSocket = ({
    enabled,
    token,
    onError,
    onTableState,
    onRoundResult,
    onWalletUpdate,
    onJoinedPending,
}: UseBlackjackSocketOptions) => {
    const socketRef = useRef<Socket | null>(null)
    const onErrorRef = useRef<UseBlackjackSocketOptions['onError']>(onError)
    const onTableStateRef = useRef<UseBlackjackSocketOptions['onTableState']>(onTableState)
    const onRoundResultRef = useRef<UseBlackjackSocketOptions['onRoundResult']>(onRoundResult)
    const onWalletUpdateRef = useRef<UseBlackjackSocketOptions['onWalletUpdate']>(onWalletUpdate)
    const onJoinedPendingRef = useRef<UseBlackjackSocketOptions['onJoinedPending']>(onJoinedPending)
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
    const [lastError, setLastError] = useState<string>('')

    useEffect(() => {
        onErrorRef.current = onError
        onTableStateRef.current = onTableState
        onRoundResultRef.current = onRoundResult
        onWalletUpdateRef.current = onWalletUpdate
        onJoinedPendingRef.current = onJoinedPending
    }, [onError, onTableState, onRoundResult, onWalletUpdate, onJoinedPending])

    useEffect(() => {
        if (!enabled) {
            if (socketRef.current) {
                socketRef.current.disconnect()
                socketRef.current = null
            }
            setConnectionStatus('idle')
            return
        }

        setConnectionStatus('connecting')

        const socket = io(`${resolveSocketUrl()}/blackjack`, {
            autoConnect: true,
            transports: ['websocket', 'polling'],
            auth: token ? { token } : undefined,
        })

        socketRef.current = socket

        socket.on('connect', () => {
            setConnectionStatus('connected')
            setLastError('')
        })

        socket.on('disconnect', () => {
            setConnectionStatus('disconnected')
        })

        socket.on('connect_error', (error: Error) => {
            setConnectionStatus('error')
            setLastError(error.message || 'Connexion socket impossible')
        })

        socket.on('bj:error', (payload: BlackjackErrorPayload) => {
            const errorMessage = payload?.message || 'Erreur blackjack inconnue'
            setLastError(errorMessage)
            onErrorRef.current?.(payload)
        })

        socket.on('bj:joined-pending', (payload: BlackjackJoinedPendingPayload) => {
            onJoinedPendingRef.current?.(payload)
        })

        socket.on('bj:table-state', (payload: BlackjackTableStatePayload) => {
            setLastError('')
            onTableStateRef.current?.(payload)
        })

        socket.on('bj:round-result', (payload: BlackjackRoundResultPayload) => {
            onRoundResultRef.current?.(payload)
        })

        socket.on('bj:wallet-update', (payload: BlackjackWalletUpdatePayload) => {
            onWalletUpdateRef.current?.(payload)
        })

        return () => {
            socket.disconnect()
            socketRef.current = null
        }
    }, [enabled, token])

    const emit = useCallback((eventName: string, payload: object) => {
        const socket = socketRef.current
        if (!socket || !socket.connected) {
            return false
        }

        setLastError('')
        socket.emit(eventName, payload)
        return true
    }, [])

    const emitJoin = useCallback((payload: BlackjackJoinPayload) => emit('bj:join', payload), [emit])
    const emitLeave = useCallback((payload: BlackjackActionPayload) => emit('bj:leave', payload), [emit])
    const emitStartRound = useCallback((payload: BlackjackActionPayload) => emit('bj:start-round', payload), [emit])
    const emitPlaceBet = useCallback((payload: BlackjackPlaceBetPayload) => emit('bj:place-bet', payload), [emit])
    const emitHit = useCallback((payload: BlackjackActionPayload) => emit('bj:hit', payload), [emit])
    const emitStand = useCallback((payload: BlackjackActionPayload) => emit('bj:stand', payload), [emit])
    const emitDouble = useCallback((payload: BlackjackActionPayload) => emit('bj:double', payload), [emit])

    let exposedConnectionStatus: ConnectionStatus = connectionStatus
    if (enabled && connectionStatus === 'idle') {
        exposedConnectionStatus = 'connecting'
    }

    if (!enabled) {
        exposedConnectionStatus = 'idle'
    }

    return {
        connectionStatus: exposedConnectionStatus,
        lastError,
        emitJoin,
        emitLeave,
        emitStartRound,
        emitPlaceBet,
        emitHit,
        emitStand,
        emitDouble,
    }
}
