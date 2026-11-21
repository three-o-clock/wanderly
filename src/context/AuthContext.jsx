import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profile, setProfile] = useState(null) // { name, gender }; gender stays null until onboarding is done

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const uid = session?.user?.id
  async function loadProfile(id) {
    const [a, b] = await Promise.all([
      supabase.from('profiles').select('name').eq('id', id).maybeSingle(),
      supabase.from('profile_private').select('gender').eq('id', id).maybeSingle(),
    ])
    setProfile({ name: a.data?.name || null, gender: b.data?.gender || null })
  }
  useEffect(() => { if (uid) loadProfile(uid); else setProfile(null) }, [uid])

  const loading = authLoading || (!!uid && profile === null)
  return (
    <AuthCtx.Provider value={{ session, user: session?.user, loading, profile, refreshProfile: () => loadProfile(uid) }}>
      {children}
    </AuthCtx.Provider>
  )
}