import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Calendar({ trips, selectedId }) {
  const [m, setM] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const lead = (m.getDay() + 6) % 7
  const n = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate()
  const cells = [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)]
  const iso = d => new Date(Date.UTC(m.getFullYear(), m.getMonth(), d)).toISOString().slice(0, 10)
  const shift = k => setM(new Date(m.getFullYear(), m.getMonth() + k, 1))
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold">{m.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
        <div className="flex gap-1">
          <button onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={20} /></button>
          <button onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {'MTWTFSS'.split('').map((c, i) => <span key={i} className="opacity-50 text-xs">{c}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />
          const hits = trips.filter(t => iso(d) >= t.start_date && iso(d) <= t.end_date)
          const bg = hits.some(t => t.id === selectedId) ? 'bg-blush font-bold' : hits.length ? 'bg-lime' : ''
          return <span key={i} title={hits.map(t => t.destination).join(', ')} className={`py-1.5 rounded-full ${bg}`}>{d}</span>
        })}
      </div>
    </div>
  )
}
