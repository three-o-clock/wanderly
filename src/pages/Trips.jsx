import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { geocode } from '../lib/api'
import { buildItinerary, STYLES } from '../lib/itinerary'
import { PLACE_TYPES } from '../lib/theme'
import ItineraryEditor from '../components/ItineraryEditor'

const empty = { destination: '', start_date: '', end_date: '', budget: '', category: 'City', is_public: false, max_people: 4 }

export default function Trips() {
  const { user } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [trips, setTrips] = useState([])
  const [f, setF] = useState({ ...empty, destination: loc.state?.destination || '', category: loc.state?.category || 'City' })
  const [opts, setOpts] = useState(null)
  const [pick, setPick] = useState(0)
  const [geo, setGeo] = useState(null)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [source, setSource] = useState(null)
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const load = () => supabase.from('trips').select('*, trip_members!inner(user_id)').eq('trip_members.user_id', user.id).order('start_date').then(({ data }) => setTrips(data || []))
  useEffect(() => { load() }, [])

  async function generate(e) {
    e.preventDefault(); setErr(null); setBusy(true)
    if (f.end_date < f.start_date) { setBusy(false); return setErr('The end date must be after the start date.') }
    if ((new Date(f.end_date) - new Date(f.start_date)) / 864e5 > 30) { setBusy(false); return setErr('Trips can be up to 30 days long.') }
    const g = await geocode(f.destination).catch(() => null)
    if (!g) { setBusy(false); return setErr("We couldn't find that place. Try a city name, like Lisbon or Goa.") }
    setGeo(g)
    const { data, error } = await supabase.functions.invoke('plan-trip', {
      body: { destination: g.label, start_date: f.start_date, end_date: f.end_date, budget: Number(f.budget), category: f.category } })
    if (!error && data?.options?.length) {
      setOpts(data.options.map((o, i) => ({ ...o, perDay: STYLES[i]?.perDay ?? 3 }))); setSource('ai')
    } else {
      setOpts(STYLES.map((s, i) => ({ ...s, days: buildItinerary(g.label, f.start_date, f.end_date, s.perDay, i * 2) }))); setSource('template')
    }
    setPick(0); setBusy(false)
  }

  async function save() {
    const { data, error } = await supabase.from('trips').insert({
      destination: geo.label, lat: geo.lat, lng: geo.lng, start_date: f.start_date, end_date: f.end_date,
      budget: Number(f.budget) || 0, category: f.category, is_public: f.is_public, max_people: Number(f.max_people) || 4, itinerary: opts[pick].days,
    }).select().single()
    if (error) return setErr(error.message)
    nav(`/dashboard?trip=${data.id}`)
  }

  const perDay = f.budget && opts ? Math.round(Number(f.budget) / opts[0].days.length) : 0
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-5">
        <form onSubmit={generate} className="glass p-6 space-y-3 h-fit">
          <h2 className="hand text-4xl">Plan a trip</h2>
          <input className="input" required placeholder="Where to? (e.g. Lisbon)" value={f.destination} onChange={set('destination')} />
          <label className="block text-sm">Starts<input className="input" type="date" required value={f.start_date} onChange={set('start_date')} /></label>
          <label className="block text-sm">Ends<input className="input" type="date" required value={f.end_date} onChange={set('end_date')} /></label>
          <input className="input" type="number" min="0" required placeholder="Total budget (₹)" value={f.budget} onChange={set('budget')} />
          <select aria-label="Category" className="input" value={f.category} onChange={set('category')}>{PLACE_TYPES.map(c => <option key={c}>{c}</option>)}</select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_public} onChange={set('is_public')} />Let others join this trip</label>
          {f.is_public && <label className="block text-sm">Max people<input className="input" type="number" min="2" value={f.max_people} onChange={set('max_people')} /></label>}
          {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
          <button disabled={busy} className="btn btn-pink w-full justify-center"><Sparkles size={18} />{busy ? 'Planning with AI…' : 'Show itineraries'}</button>
        </form>

        <div className="md:col-span-2 glass p-6">
          {!opts ? <p className="opacity-70">Your itinerary options will show up here. Pick one, edit anything you like, then save the trip.</p> : <>
            <div className="flex gap-2 mb-1" role="tablist">
              {opts.map((o, i) => <button key={o.name} role="tab" aria-selected={pick === i} onClick={() => setPick(i)} className={`btn ${pick === i ? 'btn-pink' : 'btn-ghost'}`}>{o.name}</button>)}
            </div>
            <p className="text-sm opacity-70 mb-4">{geo.label} · about ₹{perDay.toLocaleString('en-IN')} per day · {opts[pick].perDay} activities a day</p>
            <p className="text-xs mb-3">{source === 'ai' ? 'Drafted by Gemini. Edit anything below.' : 'The AI planner is busy or unavailable, so this is a basic plan. Edit anything below.'}</p>
            <ItineraryEditor value={opts[pick].days} onSave={d => setOpts(opts.map((o, i) => i === pick ? { ...o, days: d } : o))} />
            <button className="btn btn-pink mt-5" onClick={save}>Use this plan</button>
          </>}
        </div>
      </div>

      <h2 className="hand text-4xl text-white drop-shadow">Your trips</h2>
      {trips.length === 0 && <p className="glass p-6">No trips yet. Fill in the form above to create your first one.</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trips.map(t => (
          <article key={t.id} className="glass overflow-hidden">
            <div className="h-32" style={{ background: t.cover_url ? `url(${t.cover_url}) center/cover` : 'linear-gradient(135deg,#0f2a3d,#3b7fa6)' }} />
            <div className="p-5">
              <div className="flex justify-between"><h3 className="hand text-3xl">{t.destination}</h3>
                {t.user_id === user.id && <button aria-label={`Delete ${t.destination}`} onClick={async () => { await supabase.from('trips').delete().eq('id', t.id); load() }}><Trash2 size={18} /></button>}</div>
              <p className="text-sm opacity-70">{t.start_date} to {t.end_date}{t.is_public && ' · open to join'}</p>
              <Link to={`/dashboard?trip=${t.id}`} className="btn btn-ghost mt-3 !py-1.5 text-sm">Open trip</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
