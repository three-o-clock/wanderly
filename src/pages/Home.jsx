import { Link } from 'react-router-dom'
import { CalendarDays, Wallet, Luggage, Map, Plane, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const features = [
  { icon: CalendarDays, title: 'One calendar for every trip', text: 'See all your dates side by side so nothing overlaps.' },
  { icon: Wallet, title: 'Budget without the spreadsheet', text: 'Set a budget, log what you spend, watch the ring fill up.' },
  { icon: Luggage, title: 'Packing lists that stick', text: 'Tick items off on your phone and they stay ticked.' },
  { icon: Map, title: 'Everything in one place', text: 'Destinations, dates and costs together, not in five apps.' },
]

export default function Home() {
  const { session } = useAuth()
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <header className="glass flex items-center justify-between px-6 py-3">
        <span className="hand text-3xl">Wanderly</span>
        <div className="flex gap-2">
          {session ? (
            <Link to="/dashboard" className="btn btn-pink">Open dashboard</Link>
          ) : (<>
            <Link to="/auth" className="btn btn-pink">Sign in with Google</Link>
          </>)}
        </div>
      </header>

      <section className="grid md:grid-cols-2 gap-8 items-center py-16 md:py-24">
        <div>
          <h1 className="hand text-5xl md:text-7xl leading-[1.05] text-white drop-shadow-lg">Plan the trip.<br />Skip the chaos.</h1>
          <p className="mt-6 text-lg max-w-md bg-white/50 backdrop-blur rounded-2xl p-4">
            Wanderly keeps your dates, budget and packing list together, so you can spend your time actually going somewhere.
          </p>
          <Link to={session ? '/dashboard' : '/auth'} className="btn btn-pink mt-6 text-lg">
            <Plane size={20} />Start planning free
          </Link>
        </div>

        <div className="relative h-[380px] hidden md:block" aria-hidden="true">
          <div className="glass absolute top-0 right-4 w-72 p-5 drift" style={{ '--r': '3deg' }}>
            <p className="hand text-4xl text-pink-500">Paris, France</p>
            <p className="text-sm opacity-70">26 – 28 Jul</p>
            <div className="mt-3 flex gap-2 text-xs">
              {['Montmartre', 'Louvre', 'Shopping'].map(t => <span key={t} className="bg-white rounded-full px-3 py-1">{t}</span>)}
            </div>
          </div>
          <div className="glass absolute top-44 left-0 w-60 p-5 drift" style={{ '--r': '-4deg', animationDelay: '.8s' }}>
            <p className="text-sm opacity-70">Days left</p>
            <p className="hand text-7xl">17</p>
          </div>
          <div className="glass absolute bottom-0 right-0 w-64 p-5 drift" style={{ '--r': '2deg', animationDelay: '1.6s' }}>
            <p className="font-semibold">Packing list</p>
            <p className="text-sm mt-2 line-through opacity-50">Passport</p>
            <p className="text-sm">Camera & charger</p>
            <p className="text-sm">Winter jacket</p>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-16">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="glass p-6">
            <span className="inline-flex p-3 rounded-2xl bg-lime"><Icon size={22} /></span>
            <h3 className="font-bold mt-4">{title}</h3>
            <p className="text-sm mt-1 opacity-80">{text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}