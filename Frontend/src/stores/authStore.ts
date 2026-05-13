import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AuthUser = {
    id: number
    email: string
    username: string
    birthDate?: string | null
    avatarUrl: string | null
    verified: boolean
    balance: number
    createdAt: string
    token: string
}

type AuthState = {
    user: AuthUser | null
    setUser: (user: AuthUser) => void
    updateBalance: (balance: number) => void
    clearUser: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user }),
            updateBalance: (balance) => set((state) => {
                if (!state.user) {
                    return state
                }

                return {
                    user: {
                        ...state.user,
                        balance,
                    },
                }
            }),
            clearUser: () => set({ user: null }),
        }),
        {
            name: 'auth-user',
        }
    )
)
