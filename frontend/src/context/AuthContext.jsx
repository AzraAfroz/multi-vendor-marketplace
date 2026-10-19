import { useEffect, useMemo, useState } from 'react'
import AuthContext from './authContextValue.js'
import { currentUserRequest, googleAuthRequest, loginRequest, logoutRequest } from '../services/authService.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => sessionStorage.getItem('marketplace_token'))
  const [ready, setReady] = useState(!sessionStorage.getItem('marketplace_token'))

  useEffect(() => {
    if (!token) return
    currentUserRequest()
      .then(setUser)
      .catch(() => {
        sessionStorage.removeItem('marketplace_token')
        setToken(null)
      })
      .finally(() => setReady(true))
  }, [token])

  async function login(credentials) {
    const result = await loginRequest(credentials)
    setUser(result.user)
    setToken(result.token)
    sessionStorage.setItem('marketplace_token', result.token)
    return result
  }

  async function loginWithGoogle(payload) {
    const result = await googleAuthRequest(payload)
    setUser(result.user)
    setToken(result.token)
    sessionStorage.setItem('marketplace_token', result.token)
    return result
  }

  async function logout() {
    try {
      await logoutRequest()
    } finally {
      sessionStorage.removeItem('marketplace_token')
      setUser(null)
      setToken(null)
    }
  }

  async function refreshUser() {
    const currentUser = await currentUserRequest()
    setUser(currentUser)
    return currentUser
  }

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      isAuthenticated: Boolean(token && user),
      login,
      loginWithGoogle,
      logout,
      refreshUser,
    }),
    [user, token, ready]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
