import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const OPTIONS = [['female', 'Female'], ['male', 'Male'], ['nonbinary', 'Non-binary or other'], ['undisclosed', 'Prefer not to say']]

export default function Welcome() {
  const { user, profile, refreshProfile } = useAuth()
  const nav = useNavigate()
  const first = !profile?.gender
  const [name, setName] = useState(profile?.name || user.user_metadata?.full_name || '')
  const [gender, setGender] = useState(profile?.gender || '')
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  async function save(e) {
    e.preventDefault()
    if (!gender) return setErr('Please choose one option.')
    setBusy(true); setErr(null)
    const a = await supabase.from('profiles').upsert({ id: user.id, name: name.trim() })
    const b = await supabase.from('profile_private').upsert({ id: user.id, gender })
    setBusy(false)
    if (a.error || b.error) return setErr((a.error || b.error).message)
    await refreshProfile()
    nav('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form onSubmit={save} className="glass w-full max-w-md p-8 space-y-5">
        <span className="hand text-4xl block">Wanderly</span>
        <div>
          <h1 className="text-xl font-bold">{first ? 'Welcome! Tell us about you' : 'Your profile'}</h1>
          <p className="text-sm opacity-70 mt-1">Your name is shown to your travel companions. Your gender is never shown to anyone. It is only used to keep women-only trips women-only.</p>
        </div>
        <label className="block text-sm font-semibold">Name
          <input className="input mt-1 font-normal" required maxLength={60} value={name} onChange={e => setName(e.target.value)} />
        </label>
        <fieldset>
          <legend className="text-sm font-semibold mb-2">Gender</legend>
          <div className="grid grid-cols-2 gap-2">
            {OPTIONS.map(([v, l]) => (
              <label key={v} className={`btn justify-center text-sm cursor-pointer ${gender === v ? 'btn-pink' : 'btn-ghost'}`}>
                <input type="radio" name="gender" value={v} checked={gender === v} onChange={() => setGender(v)} className="sr-only" />{l}
              </label>))}
          </div>
        </fieldset>
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        <button disabled={busy} className="btn btn-pink w-full justify-center">{busy ? 'Saving…' : first ? 'Continue' : 'Save'}</button>
        <button type="button" className="text-sm underline block mx-auto" onClick={async () => { await supabase.auth.signOut(); nav('/') }}>Sign out</button>
      </form>
    </div>
  )
}