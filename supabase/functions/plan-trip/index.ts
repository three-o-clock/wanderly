// Supabase Edge Function: drafts ONE itinerary with Gemini. The API key never reaches the browser.
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
// Free-tier quota is per project AND per model, so falling back to another model gives real extra headroom.
// Model names change often: override with `supabase secrets set GEMINI_MODELS=a,b,c`.
const MODELS = (Deno.env.get('GEMINI_MODELS') ?? 'gemini-3.5-flash,gemini-3.1-flash-lite,gemini-3.5-flash-lite').split(',')
const PER_DAY: Record<string, number> = { Relaxed: 2, Balanced: 3, Packed: 4 }
const BUDGET_MS = 40000 // stop trying more models after this long, so the user is never stuck waiting

function ask(model: string, prompt: string, thinking: boolean, ms: number) {
  const generationConfig: Record<string, unknown> = { responseMimeType: 'application/json' }
  // Gemini 3.x thinks by default, which is slow. MINIMAL is fine for this task.
  if (thinking) generationConfig.thinkingConfig = { thinkingLevel: 'MINIMAL' }
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': Deno.env.get('GEMINI_API_KEY')! },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
    signal: AbortSignal.timeout(ms),
  })
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { destination, start_date, end_date, budget, category, pace } = await req.json()
    const n = Math.round((+new Date(end_date) - +new Date(start_date)) / 864e5) + 1
    if (!destination || !(n >= 1 && n <= 14)) return json({ error: 'AI plans cover 1 to 14 days' }, 400)
    const name = PER_DAY[pace] ? pace : 'Balanced'
    const prompt = `Plan a trip to ${destination} from ${start_date} to ${end_date} (${n} days). Budget about ₹${budget} (₹${Math.round(budget / n)} per day). Place type: ${category}. Pace: ${name}, exactly ${PER_DAY[name]} activities per day.
Use real, well-known places in or near ${destination} and group nearby places on the same day. Day 1 starts with arrival and the last day ends with departure. Times are 24h HH:MM in order. Titles are under 70 characters.
Reply ONLY with JSON in this exact shape: {"days":[[["09:00","Title"],["13:00","Title"]],[["09:00","Title"]]]} with exactly ${n} days.`

    const t0 = Date.now()
    for (const model of MODELS) {
      for (const thinking of [true, false]) {
        const left = BUDGET_MS - (Date.now() - t0)
        if (left < 6000) return json({ error: 'AI is slow right now' }, 503)
        let r: Response
        try { r = await ask(model.trim(), prompt, thinking, Math.min(left, 25000)) } catch { break } // timeout: next model
        if (r.status === 400 && thinking) continue // this model rejects the thinking setting: retry without it
        if (!r.ok) { console.log(model, r.status); break } // 429 or unavailable: next model
        try {
          const text = (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text
          const days = JSON.parse(text).days
          if (!Array.isArray(days) || days.length !== n) break
          const out = days.map((d: string[][], i: number) => {
            const dt = new Date(start_date); dt.setDate(dt.getDate() + i)
            return { day: i + 1, date: dt.toISOString().slice(0, 10), items: d.map(([time, title]) => ({ id: crypto.randomUUID(), time: String(time), title: String(title) })) }
          })
          return json({ options: [{ name, days: out }], model })
        } catch { break }
      }
    }
    return json({ error: 'AI unavailable' }, 503) // the app falls back to the basic planner
  } catch (e) { return json({ error: String(e) }, 500) }
})