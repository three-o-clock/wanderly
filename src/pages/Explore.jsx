import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CalendarDays, Wallet, ChevronDown, Sparkles } from 'lucide-react'
import { SUGGESTIONS } from '../data/suggestions'
import { PLACE_TYPES, previewBackground } from '../lib/theme'

const CATS = ['All', ...PLACE_TYPES]
// Photos come from Wikipedia's page images, so no image files are stored in the project.
const wikiImage = t => fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(t)}&prop=pageimages&pithumbsize=800&redirects=1&format=json&origin=*`)
  .then(r => r.json()).then(j => Object.values(j.query.pages)[0]?.thumbnail?.source).catch(() => null)

export default function Explore() {
  const nav = useNavigate()
  const [cat, setCat] = useState('All')
  useEffect(() => { previewBackground(cat) }, [cat])
  useEffect(() => () => previewBackground('All'), [])
  const [open, setOpen] = useState(null)
  const [imgs, setImgs] = useState({})
  useEffect(() => { SUGGESTIONS.forEach(s => wikiImage(s.wiki).then(u => u && setImgs(m => ({ ...m, [s.id]: u })))) }, [])
  const shown = SUGGESTIONS.filter(s => cat === 'All' || s.type === cat)

  return (
    <div>
      <h1 className="hand text-6xl text-white drop-shadow">Explore India</h1>
      <p className="text-white drop-shadow mb-4">Ready-made trip ideas. Pick one and we'll turn it into your own plan.</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {CATS.map(c => <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`btn !py-1.5 ${cat === c ? 'bg-ink text-white' : 'btn-ghost'}`}>{c}</button>)}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {shown.map(s => (
          <article key={s.id} className="glass overflow-hidden">
            <div className="h-48 relative" style={{ background: imgs[s.id] ? `url(${imgs[s.id]}) center/cover` : 'linear-gradient(135deg,#0f2a3d,#3b7fa6)' }}>
              <span className="absolute top-3 left-3 bg-white/90 rounded-full px-3 py-1 text-xs font-semibold">{s.type}</span>
            </div>
            <div className="p-5">
              <h3 className="font-bold leading-snug">{s.title}</h3>
              <p className="text-sm opacity-70">{s.state}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-2 opacity-80">
                <span className="flex items-center gap-1"><Clock size={14} />{s.days} days</span>
                <span className="flex items-center gap-1"><CalendarDays size={14} />{s.best}</span>
                <span className="flex items-center gap-1"><Wallet size={14} />{s.budget}</span>
              </div>
              {open === s.id && (
                <div className="mt-4 text-sm space-y-3">
                  <ol className="space-y-1">{s.plan.map((p, i) => <li key={i}><b>Day {i + 1}:</b> {p}</li>)}</ol>
                  <p><b>Stay:</b> {s.stay.join(' · ')}</p>
                  <p className="bg-lime rounded-xl px-3 py-2">{s.tip}</p>
                </div>)}
              <div className="flex gap-2 mt-4">
                <button className="btn btn-ghost !py-1.5 text-sm" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)}>
                  {open === s.id ? 'Hide' : 'View'} itinerary<ChevronDown size={16} className={open === s.id ? 'rotate-180' : ''} /></button>
                <button className="btn btn-pink !py-1.5 text-sm" onClick={() => nav('/trips', { state: { destination: s.dest, category: s.type } })}><Sparkles size={16} />Plan this trip</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="text-xs text-white/90 mt-6 drop-shadow">Budgets are rough per-person estimates and photos come from Wikipedia. Check current prices and permits before you book.</p>
    </div>
  )
}