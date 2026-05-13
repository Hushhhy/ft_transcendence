import './App.css'
import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.tsx'
import Layout from './components/Layout.tsx'
import Login from './pages/Login.tsx'
import Deposit from './pages/Deposit.tsx'
import Responsible from './pages/Responsible.tsx'
import Legal from './pages/Legal.tsx'
import Account from './pages/Account.tsx'
import Blackjack from './pages/Blackjack.tsx'
import ForgotPwd from './pages/ForgotPwd.tsx'
import VerifyEmail from './pages/VerifyEmail.tsx'
import Leaderboard from './pages/Leaderboard.tsx'
import Friends from './pages/Friends.tsx'
import { useAuthStore } from './stores/authStore'
import { usePresenceSocket } from './features/presence/usePresenceSocket'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/Login" replace />
  }

  return children
}

function PresenceTracker() {
  usePresenceSocket()
  return null
}

function App() {
  return (
    <>
      <BrowserRouter>
        <PresenceTracker />
        <Routes>
          <Route element={<Layout/>}>
            <Route path="/" element={<Home/>}/>
            <Route path="/Login" element={<Login/>}/>
            <Route path="/ForgotPwd" element={<ForgotPwd/>} />
            <Route path="/reset-password" element={<ForgotPwd/>} />
            <Route path="/verify-email" element={<VerifyEmail/>} />
            <Route path="/Account" element={<Account/>}/>
            <Route path="/Deposit" element={<ProtectedRoute><Deposit/></ProtectedRoute>}/>
            <Route path="/Blackjack" element={<Blackjack/>}/>
            <Route path="/Legal" element={<Legal/>}/>
            <Route path="/Responsible" element={<Responsible/>}/>
            <Route path="/Leaderboard" element={<Leaderboard/>}/>
            <Route path="/Friends" element={<ProtectedRoute><Friends/></ProtectedRoute>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
