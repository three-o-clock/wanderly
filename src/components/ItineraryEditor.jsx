import { useEffect, useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'

export default function ItineraryEditor({ value, onSave, readOnly }) {
  const [days, setDays] = useState(value || [])
  const [dirty, setDirty] = useState(false)
  useEffect(() => { setDays(value || []); setDirty(false) }, [value])

  const edit = (di, fn) => { setDays(days.map((d, i) => i === di ? { ...d, items: fn(d.items) } : d)); setDirty(true) }
  const setItem = (di, id, k, v) => edit(di, items => items.map(x => x.id === id ? { ...x, [k]: v } : x))
  const sorted = items => [...items].sort((a, b) => a.time.localeCompare(b.time))

  if (!days.length) return <p className="text-sm opacity-70">No itinerary yet.</p>
  return (
    <div className="space-y-4">
      {days.map((d, di) => (
        <div key={d.day}>
          <h3 className="font-bold mb-2">Day {d.day} <span className="font-normal opacity-60 text-sm">{d.date}</span></h3>
          <ul className="space-y-2">
            {d.items.map(it => readOnly ? (
              <li key={it.id} className="bg-white/60 rounded-xl px-3 py-2 text-sm"><b>{it.time}</b> {it.title}</li>
            ) : (
              <li key={it.id} className="flex gap-2">
                <input type="time" className="input !w-28 !py-2" value={it.time} onChange={e => setItem(di, it.id, 'time', e.target.value)} />
                <input className="input !py-2" value={it.title} aria-label="Activity" onChange={e => setItem(di, it.id, 'title', e.target.value)} />
                <button onClick={() => edit(di, items => items.filter(x => x.id !== it.id))} aria-label="Remove activity"><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
          {!readOnly && (
            <button className="text-sm mt-2 flex items-center gap-1 underline" onClick={() => edit(di, items => sorted([...items, { id: crypto.randomUUID(), time: '12:00', title: 'New activity' }]))}>
              <Plus size={14} />Add activity
            </button>
          )}
        </div>
      ))}
      {!readOnly && dirty && (
        <button className="btn btn-pink" onClick={() => { onSave(days.map(d => ({ ...d, items: sorted(d.items) }))); setDirty(false) }}>
          <Save size={16} />Save itinerary
        </button>
      )}
    </div>
  )
}
