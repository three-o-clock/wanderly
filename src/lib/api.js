// Free, keyless public APIs: Open-Meteo (geocoding + weather) and Frankfurter (currency)
export async function geocode(q) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`).then(r => r.json())
  const g = r.results?.[0]
  return g ? { lat: g.latitude, lng: g.longitude, label: g.country ? `${g.name}, ${g.country}` : g.name } : null
}
export const getWeather = (lat, lng) =>
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=5&timezone=auto`).then(r => r.json())
export async function getRate(to) {
  if (to === 'INR') return 1
  const r = await fetch(`https://api.frankfurter.dev/v1/latest?base=INR&symbols=${to}`).then(r => r.json())
  return r.rates[to]
}
