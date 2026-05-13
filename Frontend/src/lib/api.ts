import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
})

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().user?.token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default api
