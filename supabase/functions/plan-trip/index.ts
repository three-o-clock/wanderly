// Supabase Edge Function: drafts three itineraries with Gemini. The API key never reaches the browser.
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
// Free-tier quota is per project AND per model, so falling back to another model gives real extra headroom.
// Model names change often: override with `supabase secrets set GEMINI_MODELS=a,b,c`.
const MODELS = (Deno.env.get('GEMINI_MODELS') ?? 'gemini-3.5-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite').split(',')

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { destination, start_date, end_date, budget, category } = await req.json()
    const n = Math.round((+new Date(end_date) - +new Date(start_date)) / 864e5) + 1
    if (!destination || !(n >= 1 && n <= 14)) return json({ error: 'AI plans cover 1 to 14 days' }, 400)
    const prompt = `You are a careful travel planner. Create THREE day-by-day itineraries for a trip to ${destination} from ${start_date} to ${end_date} (${n} days). Total budget: about ₹${budget} (₹${Math.round(budget / n)} per day). Place type: ${category}.
Options: "Relaxed" (2 activities per day), "Balanced" (3), "Packed" (4).
Rules: use real, well-known places in or near ${destination}; group nearby places on the same day; day 1 starts with arrival and the last day ends with departure; times are 24h HH:MM in order; each title is under 90 characters and may mention a rough cost in ₹.
Reply ONLY with JSON: {"options":[{"name":"Relaxed","days":[{"items":[{"time":"09:00","title":"..."}]}]},{"name":"Balanced","days":[...]},{"name":"Packed","days":[...]}]} with exactly ${n} days in each option.`

    for (const model of MODELS) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model.trim()}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': Deno.env.get('GEMINI_API_KEY')! },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }),
      })
      if (!r.ok) { console.log(model, r.status); continue } // 429 or model unavailable: try the next model
      try {
        const text = (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text
        const opts = JSON.parse(text).options
        if (opts.length !== 3 || opts.some((o: any) => o.days.length !== n)) continue
        const options = opts.map((o: any) => ({
          name: o.name,
          days: o.days.map((d: any, i: number) => {
            const dt = new Date(start_date); dt.setDate(dt.getDate() + i)
            return { day: i + 1, date: dt.toISOString().slice(0, 10), items: d.items.map((it: any) => ({ id: crypto.randomUUID(), time: String(it.time), title: String(it.title) })) }
          }),
        }))
        return json({ options, model })
      } catch { continue }
    }
    return json({ error: 'AI unavailable' }, 503) // the app falls back to the basic planner
  } catch (e) { return json({ error: String(e) }, 500) }
})
