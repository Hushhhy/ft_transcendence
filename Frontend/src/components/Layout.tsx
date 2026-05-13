import { useEffect } from 'react'
import TopBar from './TopBar.tsx'
import BottomBar from './BottomBar.tsx'
import { Outlet, useLocation } from 'react-router-dom'

function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div>
      {!isHome && <TopBar />}
      <main><Outlet /></main>
      <BottomBar />
    </div>
  )
}

export default Layout