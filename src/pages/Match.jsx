import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, CalendarDays, Wallet, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

import { PLACE_TYPES, previewBackground } from '../lib/theme'
const CATS = ['All', ...PLACE_TYPES]
const fmt = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

export default function Match() {
  const { user, profile } = useAuth()
  const [trips, setTrips] = useState([])
  const [cat, setCat] = useState('All')
  useEffect(() => { previewBackground(cat) }, [cat])
  useEffect(() => () => previewBackground('All'), [])
  const today = new Date().toISOString().slice(0, 10)

  const load = () => supabase.from('trips').select('*, trip_members(user_id)').eq('is_public', true).gte('end_date', today).order('start_date')
    .then(({ data }) => setTrips(data || []))
  useEffect(() => { load() }, [])

  const join = async id => { const { error } = await supabase.from('trip_members').insert({ trip_id: id }); if (error) alert("You can't join this trip."); load() }
  const leave = async id => { await supabase.from('trip_members').delete().eq('trip_id', id).eq('user_id', user.id); load() }
  const shown = trips.filter(t => cat === 'All' || t.category === cat)

  return (
    <div>
      <h1 className="hand text-6xl text-white drop-shadow">Match &amp; Go</h1>
      <p className="text-white drop-shadow mb-4">Find travellers heading your way and join their trip.</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {CATS.map(c => <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`btn !py-1.5 ${cat === c ? 'bg-ink text-white' : 'btn-ghost'}`}>{c}</button>)}
      </div>
      {shown.length === 0 && <p className="glass p-6">No open trips here yet. Open one of your own trips from the dashboard and it will show up for everyone.</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {shown.map(t => {
          const n = t.trip_members.length, joined = t.trip_members.some(m => m.user_id === user.id), full = n >= t.max_people, canJoin = !t.women_only || profile?.gender === 'female'
          return (
            <article key={t.id} className="glass overflow-hidden">
              <div className="h-48 relative" style={{ background: t.cover_url ? `url(${t.cover_url}) center/cover` : 'linear-gradient(135deg,#0f2a3d,#3b7fa6)' }}>
                <span className="absolute top-3 left-3 bg-white/90 rounded-full px-3 py-1 text-xs font-semibold">{t.category}</span>
                {t.women_only && <span className="absolute top-3 right-3 bg-blush rounded-full px-3 py-1 text-xs font-semibold">Women only</span>}
              </div>
              <div className="p-5">
                <h3 className="hand text-3xl">{t.destination}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1 opacity-80">
                  <span className="flex items-center gap-1"><CalendarDays size={14} />{fmt(t.start_date)} – {fmt(t.end_date)}</span>
                  <span className="flex items-center gap-1"><Wallet size={14} />₹{Number(t.budget).toLocaleString('en-IN')}</span>
                  <span className="flex items-center gap-1"><Users size={14} />{n}/{t.max_people} joined</span>
                </div>
                <div className="mt-4">
                  {t.user_id === user.id ? <Link to={`/dashboard?trip=${t.id}`} className="btn btn-ghost !py-1.5">Your trip</Link>
                    : joined ? <span className="flex gap-2"><Link to={`/dashboard?trip=${t.id}`} className="btn btn-pink !py-1.5">Open</Link><button className="btn btn-ghost !py-1.5" onClick={() => leave(t.id)}>Leave</button></span>
                    : <button disabled={full || !canJoin} className="btn btn-pink !py-1.5 disabled:opacity-50" onClick={() => join(t.id)}>{full ? 'Trip is full' : !canJoin ? 'Women only' : 'Join trip'}</button>}
                </div>
              </div>
            </article>)
        })}
      </div>
    </div>
  )
}