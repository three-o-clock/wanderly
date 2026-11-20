const M = ['Breakfast at a local café', 'Guided walk through central {d}', 'Visit the best-known landmark in {d}', 'Local market tour', 'Museum or heritage site', 'Sunrise viewpoint']
const A = ['Lunch: a regional specialty', 'Day trip near {d}', 'Park or waterfront stroll', 'Shopping district', 'Cultural show or workshop', 'Rest and free time']
const E = ['Sunset spot', 'Dinner at a well-reviewed local restaurant', 'Night walk and street food', 'Live music or night market']
const X = ['Photo walk', 'Try a cooking class', 'Visit a local café', 'Explore a hidden-gem neighbourhood']
const SLOTS = {
  2: [['10:00', M], ['19:00', E]],
  3: [['09:00', M], ['13:00', A], ['19:00', E]],
  4: [['09:00', M], ['12:30', A], ['16:00', X], ['19:30', E]],
}
export const STYLES = [{ name: 'Relaxed', perDay: 2 }, { name: 'Balanced', perDay: 3 }, { name: 'Packed', perDay: 4 }]

export function buildItinerary(dest, start, end, perDay, offset) {
  const n = Math.round((new Date(end) - new Date(start)) / 864e5) + 1
  const city = dest.split(',')[0]
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(start); d.setDate(d.getDate() + i)
    let slots = SLOTS[perDay]
    if (i === 0) slots = slots.slice(1)
    if (i === n - 1 && n > 1) slots = slots.slice(0, 1)
    const items = slots.map(([time, pool], k) => ({ id: crypto.randomUUID(), time, title: pool[(i + k + offset) % pool.length].replace('{d}', city) }))
    if (i === 0) items.unshift({ id: crypto.randomUUID(), time: '14:00', title: `Arrive in ${city} and check in` })
    if (i === n - 1 && n > 1) items.push({ id: crypto.randomUUID(), time: '12:00', title: 'Check out and head home' })
    return { day: i + 1, date: d.toISOString().slice(0, 10), items }
  })
}
