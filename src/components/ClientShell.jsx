'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { checkBackendHealth, getAuthState, subscribeAuth } from '../api/client'
import Login from './Login'

export const ThreatOpsContext = createContext({
  activeItem: 'overview',
  setActiveItem: () => {},
  selectedTime: 'Last 24 Hours',
  setSelectedTime: () => {},
  backendStatus: { online: false },
  currentUser: null,
})

export const useThreatOps = () => useContext(ThreatOpsContext)

export default function ClientShell({ children, initialPage = 'overview' }) {
  const [activeItem, setActiveItem] = useState(initialPage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  )
  const [selectedTime, setSelectedTime] = useState('Last 24 Hours')
  const [defaultSettingsTab, setDefaultSettingsTab] = useState('general')
  const [avatarSrc, setAvatarSrc] = useState(null)
  const [backendStatus, setBackendStatus] = useState({ online: false })
  const [currentUser, setCurrentUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  // Sync initial URL pathname to activeItem on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\//, '').trim()
      if (path && path !== activeItem) {
        // Convert kebab-case URL to snake_case if applicable
        const normalized = path.replace(/-/g, '_')
        setActiveItem(normalized)
      }

      const handlePopState = () => {
        const currentPath = window.location.pathname.replace(/^\//, '').trim()
        const norm = (currentPath || 'overview').replace(/-/g, '_')
        setActiveItem(norm)
      }

      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Check backend health & auth
  useEffect(() => {
    let mounted = true

    const updateAuth = () => {
      const auth = getAuthState()
      if (mounted) setCurrentUser(auth.user)
    }
    updateAuth()
    setAuthReady(true)
    const unsubAuth = subscribeAuth(updateAuth)

    const checkHealth = async () => {
      const status = await checkBackendHealth()
      if (mounted) setBackendStatus(status)
    }

    checkHealth()
    const timer = setInterval(checkHealth, 20000)

    return () => {
      mounted = false
      unsubAuth()
      clearInterval(timer)
    }
  }, [])

  const handleSetActive = useCallback((page, subTab) => {
    if (!page) return
    setActiveItem(page)
    if (page === 'settings' && subTab) {
      setDefaultSettingsTab(subTab)
    }

    if (typeof window !== 'undefined') {
      const targetUrl = page === 'overview' ? '/' : `/${page.replace(/_/g, '-')}`
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({ page }, '', targetUrl)
      }
    }
  }, [])

  if (!authReady) {
    return <div className="min-h-screen bg-[#070b11]" />
  }

  if (!currentUser || !getAuthState().token) {
    return <Login onAuthenticated={user => setCurrentUser(user)} />
  }

  const contextValue = {
    activeItem,
    setActiveItem: handleSetActive,
    selectedTime,
    setSelectedTime,
    backendStatus,
    currentUser,
    defaultSettingsTab,
    avatarSrc,
    setAvatarSrc,
  }

  return (
    <ThreatOpsContext.Provider value={contextValue}>
      <div className="app-shell flex h-screen min-h-0 bg-htb-bg overflow-hidden text-htb-text">
        {/* Persistent Sidebar */}
        <Sidebar
          active={activeItem}
          setActive={handleSetActive}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          currentUser={currentUser}
        />

        {/* Scrollable Main Area */}
        <div className="app-main flex-1 flex flex-col min-w-0 min-h-0 h-full relative z-0 overflow-hidden">
          <Navbar
            toggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            setActive={handleSetActive}
            avatarSrc={avatarSrc}
            backendStatus={backendStatus}
            currentUser={currentUser}
          />
          <main className="app-content flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden relative z-0">
            {typeof children === 'function' ? children({ activeItem, handleSetActive, selectedTime, defaultSettingsTab, avatarSrc, setAvatarSrc }) : children}
          </main>
        </div>
      </div>
    </ThreatOpsContext.Provider>
  )
}
