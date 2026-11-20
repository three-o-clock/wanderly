import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function TripMap({ trips, selectedId }) {
  const el = useRef(), map = useRef(), layer = useRef()
  useEffect(() => {
    map.current = L.map(el.current).setView([20, 0], 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map.current)
    layer.current = L.layerGroup().addTo(map.current)
    return () => map.current.remove()
  }, [])
  useEffect(() => {
    layer.current.clearLayers()
    trips.filter(t => t.lat != null).forEach(t => {
      const sel = t.id === selectedId
      L.circleMarker([t.lat, t.lng], { radius: sel ? 11 : 7, color: '#0f2a3d', weight: 2, fillColor: sel ? '#f6b6e3' : '#c9f05a', fillOpacity: 1 })
        .bindTooltip(t.destination, { permanent: sel }).addTo(layer.current)
    })
    const s = trips.find(t => t.id === selectedId)
    if (s?.lat != null) map.current.setView([s.lat, s.lng], 9)
  }, [trips, selectedId])
  return <div ref={el} className="h-72 rounded-2xl overflow-hidden z-0" />
}
