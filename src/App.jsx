import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Welcome from './pages/Welcome'
import Dashboard from './pages/Dashboard'
import Trips from './pages/Trips'
import Explore from './pages/Explore'
import Match from './pages/Match'

// needProfile: new users must finish the welcome form (name and gender) before seeing the app
function Protected({ children, needProfile = true }) {
  const { session, loading, profile } = useAuth()
  if (loading) return <p className="p-10 text-center hand text-3xl">Packing your bags…</p>
  if (!session) return <Navigate to="/auth" replace />
  if (needProfile && !profile?.gender) return <Navigate to="/welcome" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/welcome" element={<Protected needProfile={false}><Welcome /></Protected>} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/match" element={<Match />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}