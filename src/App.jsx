import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Trips from './pages/Trips'
import Explore from './pages/Explore'
import Match from './pages/Match'

function Protected({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <p className="p-10 text-center hand text-3xl">Packing your bags…</p>
  return session ? children : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
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
