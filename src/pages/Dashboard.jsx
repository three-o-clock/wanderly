import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Camera, Plus, Sun, Cloud, CloudRain, Snowflake, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getRate, getWeather } from '../lib/api'
import Calendar from '../components/Calendar'
import TripMap from '../components/TripMap'
import ItineraryEditor from '../components/ItineraryEditor'
import Expenses from '../components/Expenses'
import { PLACE_TYPES, setBackground } from '../lib/theme'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AED', 'AUD']
const daysUntil = d => Math.ceil((new Date(d) - new Date().setHours(0, 0, 0, 0)) / 864e5)
const fmt = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const WxIcon = c => (c <= 1 ? Sun : c <= 48 ? Cloud : c >= 71 && c <= 77 ? Snowflake : CloudRain)

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const [trips, setTrips] = useState([])
  const [members, setMembers] = useState([])
  const [wx, setWx] = useState(null)
  const [cur, setCur] = useState('INR')
  const [rate, setRate] = useState(1)

  const load = () => supabase.from('trips').select('*, trip_members!inner(user_id)')
    .eq('trip_members.user_id', user.id).order('start_date').then(({ data }) => setTrips(data || []))
  useEffect(() => { load() }, [])
  useEffect(() => { getRate(cur).then(setRate).catch(() => setRate(1)) }, [cur])

  const trip = trips.find(t => t.id === params.get('trip')) || trips.find(t => daysUntil(t.end_date) >= 0) || trips[0]
  const mine = trip?.user_id === user.id
  const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n * rate)

  useEffect(() => {
    if (!trip) return
    setWx(null)
    if (trip.lat != null) getWeather(trip.lat, trip.lng).then(setWx).catch(() => {})
    supabase.from('trip_members').select('user_id').eq('trip_id', trip.id).then(async ({ data }) => {
      const ids = (data || []).map(m => m.user_id)
      const { data: p } = await supabase.from('profiles').select('id,name').in('id', ids)
      setMembers(ids.map(id => ({ user_id: id, name: p?.find(x => x.id === id)?.name || 'Traveller' })))
    })
  }, [trip?.id])

  useEffect(() => { if (trip) setBackground(trip.category) }, [trip?.id, trip?.category])
  const patch = async fields => { await supabase.from('trips').update(fields).eq('id', trip.id); load() }
  async function upload(e) {
    const f = e.target.files[0]; if (!f) return
    const path = `${user.id}/${trip.id}-${Date.now()}`
    const { error } = await supabase.storage.from('covers').upload(path, f)
    if (error) return alert(error.message)
    patch({ cover_url: supabase.storage.from('covers').getPublicUrl(path).data.publicUrl })
  }

  if (!trip) return (
    <div className="glass p-10 text-center">
      <p className="hand text-5xl">No trips yet</p>
      <p className="my-3">Enter a destination and dates and we'll draft an itinerary for you.</p>
      <Link to="/trips" className="btn btn-pink"><Plus size={18} />Plan your first trip</Link>
    </div>
  )

  return (
    <div className="grid md:grid-cols-3 gap-5">
      <section className="glass md:col-span-2 overflow-hidden relative min-h-64 text-white flex flex-col justify-end p-6"
        style={{ background: trip.cover_url ? `linear-gradient(transparent 30%, rgba(15,42,61,.8)), url(${trip.cover_url}) center/cover` : 'linear-gradient(135deg,#0f2a3d,#3b7fa6)' }}>
        <select aria-label="Choose trip" className="absolute top-4 left-4 input !w-auto !py-1.5 text-ink" value={trip.id} onChange={e => setParams({ trip: e.target.value })}>
          {trips.map(t => <option key={t.id} value={t.id}>{t.destination}</option>)}
        </select>
        {mine && <label className="absolute top-4 right-4 btn btn-ghost !py-1.5 text-ink cursor-pointer"><Camera size={16} />Cover photo
          <input type="file" accept="image/*" hidden onChange={upload} /></label>}
        <p className="hand text-6xl drop-shadow">{trip.destination}</p>
        <p>{fmt(trip.start_date)} – {fmt(trip.end_date)} · {daysUntil(trip.start_date) > 0 ? `${daysUntil(trip.start_date)} days to go` : daysUntil(trip.end_date) >= 0 ? 'Happening now' : 'Completed'}</p>
        <p className="text-sm flex items-center gap-1 mt-1"><Users size={14} />{members.map(m => m.name).join(', ')}</p>
        {mine && (
          <div className="flex flex-wrap gap-3 items-center mt-3 text-ink text-sm">
            <label className="btn btn-ghost !py-1.5"><input type="checkbox" checked={!!trip.is_public} onChange={e => patch({ is_public: e.target.checked })} />Open for others to join</label>
            {trip.is_public && <>
              {profile?.gender === 'female' && <label className="btn btn-ghost !py-1.5"><input type="checkbox" checked={!!trip.women_only} onChange={e => patch({ women_only: e.target.checked })} />Women only</label>}
              <label className="btn btn-ghost !py-1.5">Max people
                <input type="number" min={members.length || 1} className="w-14 bg-transparent" defaultValue={trip.max_people} onBlur={e => patch({ max_people: Number(e.target.value) })} /></label>
              <select aria-label="Category" className="input !w-auto !py-1.5" value={trip.category} onChange={e => patch({ category: e.target.value })}>{PLACE_TYPES.map(c => <option key={c}>{c}</option>)}</select>
            </>}
          </div>)}
      </section>

      <section className="glass p-6">
        <h2 className="font-bold mb-2">Weather in {trip.destination.split(',')[0]}</h2>
        {!wx ? <p className="text-sm opacity-70">Weather loads once the destination has a location.</p> : <>
          <p className="hand text-6xl">{Math.round(wx.current.temperature_2m)}°C</p>
          <ul className="mt-2 space-y-1 text-sm">
            {wx.daily.time.map((d, i) => { const I = WxIcon(wx.daily.weathercode[i]); return (
              <li key={d} className="flex items-center justify-between"><span>{fmt(d)}</span><I size={16} /><span>{Math.round(wx.daily.temperature_2m_max[i])}° / {Math.round(wx.daily.temperature_2m_min[i])}°</span></li>) })}
          </ul></>}
      </section>

      <section className="glass p-6"><Calendar trips={trips} selectedId={trip.id} /></section>
      <section className="glass p-6 md:col-span-2">
        <h2 className="font-bold mb-3">Map</h2>
        <TripMap trips={trips} selectedId={trip.id} />
      </section>

      <section className="glass p-6 md:col-span-2">
        <h2 className="font-bold mb-3">Itinerary</h2>
        <ItineraryEditor value={trip.itinerary} readOnly={!mine} onSave={it => patch({ itinerary: it })} />
      </section>
      <section className="glass p-6 h-fit">
        <h2 className="font-bold">Budget</h2>
        <p className="hand text-5xl my-2">{money(trip.budget)}</p>
        <label className="text-sm">Show amounts in
          <select className="input mt-1" value={cur} onChange={e => setCur(e.target.value)}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></label>
        <p className="text-xs opacity-70 mt-2">Amounts are stored in ₹ and converted using live rates.</p>
      </section>

      <section className="glass p-6 md:col-span-3">
        <h2 className="font-bold mb-3">Expenses and split payments</h2>
        <Expenses tripId={trip.id} members={members} uid={user.id} money={money} budget={trip.budget} />
      </section>
    </div>
  )
}