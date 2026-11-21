import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { LogOut, LayoutDashboard, Map, Compass, Users } from 'lucide-react'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { setBackground } from '../lib/theme'

export default function Layout() {
  const nav = useNavigate()
  const { user, profile } = useAuth()
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('trips').select('category,end_date,trip_members!inner(user_id)').eq('trip_members.user_id', user.id).order('start_date')
      .then(({ data }) => setBackground((data?.find(t => t.end_date >= today) || data?.[data.length - 1])?.category))
  }, [])
  const link = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${isActive ? 'bg-white shadow-sm' : 'opacity-70'}`
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <header className="glass flex items-center justify-between px-6 py-3 mb-6">
        <Link to="/" className="hand text-3xl">Wanderly</Link>
        <nav className="flex gap-1 flex-wrap">
          <NavLink to="/dashboard" className={link}><LayoutDashboard size={18} />Dashboard</NavLink>
          <NavLink to="/trips" className={link}><Map size={18} />My trips</NavLink>
          <NavLink to="/explore" className={link}><Compass size={18} />Explore</NavLink>
          <NavLink to="/match" className={link}><Users size={18} />Match &amp; Go</NavLink>
        </nav>
        <Link to="/welcome" title="Edit profile" className="hidden sm:block text-sm font-semibold hover:underline">{profile?.name}</Link>
        <button className="btn btn-ghost" onClick={async () => { await supabase.auth.signOut(); nav('/') }}>
          <LogOut size={18} />Sign out
        </button>
      </header>
      <Outlet />
    </div>
  )
}