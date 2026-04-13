import React, { createContext, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export const UserContext = createContext()

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session on refresh
    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setUser(session?.user || null)
      setLoading(false)
    }

    loadSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}