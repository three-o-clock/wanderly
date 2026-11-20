import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Expenses({ tripId, members, uid, money, budget }) {
  const [list, setList] = useState([])
  const [desc, setDesc] = useState('')
  const [amt, setAmt] = useState('')
  const name = id => members.find(m => m.user_id === id)?.name || 'Traveller'
  const load = () => supabase.from('expenses').select('*').eq('trip_id', tripId).order('created_at').then(({ data }) => setList(data || []))
  useEffect(() => { load() }, [tripId])

  async function add(e) {
    e.preventDefault()
    await supabase.from('expenses').insert({ trip_id: tripId, description: desc, amount: Number(amt) })
    setDesc(''); setAmt(''); load()
  }
  const total = list.reduce((s, e) => s + Number(e.amount), 0)
  const share = members.length ? total / members.length : 0
  const bal = members.map(m => ({ ...m, n: list.filter(e => e.paid_by === m.user_id).reduce((s, e) => s + Number(e.amount), 0) - share }))
  const owes = bal.filter(b => b.n < -0.5).map(b => ({ ...b, n: -b.n }))
  const owed = bal.filter(b => b.n > 0.5).map(b => ({ ...b }))
  const pay = []
  owes.forEach(d => owed.forEach(c => { const x = Math.min(d.n, c.n); if (x > 0.5) { pay.push(`${d.name} pays ${c.name} ${money(x)}`); d.n -= x; c.n -= x } }))

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <form onSubmit={add} className="flex gap-2 mb-3">
          <input className="input" required placeholder="What was it for?" value={desc} onChange={e => setDesc(e.target.value)} />
          <input className="input !w-32" required type="number" min="1" placeholder="₹ amount" value={amt} onChange={e => setAmt(e.target.value)} />
          <button className="btn btn-pink" aria-label="Add expense"><Plus size={18} /></button>
        </form>
        {list.length === 0 && <p className="text-sm opacity-70">No expenses yet. Add what you paid and the app splits it between everyone on the trip.</p>}
        <ul className="space-y-2">
          {list.map(e => (
            <li key={e.id} className="flex justify-between bg-white/60 rounded-xl px-3 py-2 text-sm">
              <span>{e.description} <span className="opacity-60">paid by {name(e.paid_by)}</span></span>
              <span className="flex gap-2 font-semibold">{money(e.amount)}
                {e.paid_by === uid && <button aria-label="Delete expense" onClick={async () => { await supabase.from('expenses').delete().eq('id', e.id); load() }}><Trash2 size={14} /></button>}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-sm">Spent {money(total)} of {money(budget)}</p>
        <div className="h-3 rounded-full bg-white mt-1 overflow-hidden"><div className="h-full bg-blush" style={{ width: `${Math.min(100, budget ? total / budget * 100 : 0)}%` }} /></div>
        <h3 className="font-bold mt-4">Split between {members.length} {members.length === 1 ? 'person' : 'people'}</h3>
        <p className="text-sm opacity-70">Each share: {money(share)}</p>
        <ul className="mt-2 space-y-1 text-sm">
          {pay.length ? pay.map(p => <li key={p} className="bg-lime rounded-xl px-3 py-2">{p}</li>) : <li className="opacity-70">Everyone is settled up.</li>}
        </ul>
      </div>
    </div>
  )
}
