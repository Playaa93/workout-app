'use client'

import { useEffect } from 'react'

export default function Home() {
  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }
  }, [])

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 py-6 border-b border-neutral-800">
        <h1 className="text-2xl font-bold">Workout</h1>
        <p className="text-neutral-400 text-sm mt-1">Bienvenue, haze</p>
      </header>

      {/* Quick Actions - Action First Dashboard */}
      <section className="p-4">
        <div className="grid grid-cols-3 gap-3">
          <QuickAction
            icon="🏋️"
            label="Workout"
            href="/workout"
          />
          <QuickAction
            icon="📏"
            label="Mesures"
            href="/measurements"
          />
          <QuickAction
            icon="🍎"
            label="Diète"
            href="/diet"
          />
        </div>
      </section>

      {/* Morphology CTA */}
      <section className="px-4 pb-4">
        <a
          href="/morphology"
          className="block p-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧬</span>
            <div>
              <h3 className="font-semibold">Analyse Morphologique</h3>
              <p className="text-sm text-white/70">Découvre tes exercices idéaux</p>
            </div>
          </div>
        </a>
      </section>

      {/* Stats Overview */}
      <section className="px-4 pb-4">
        <h2 className="text-lg font-semibold mb-3">Cette semaine</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Workouts" value="0" />
          <StatCard label="Calories (moy.)" value="--" />
        </div>
      </section>

      {/* Bottom Nav */}
      <nav className="mt-auto border-t border-neutral-800 px-4 py-3">
        <div className="flex justify-around">
          <NavItem icon="🏠" label="Home" active />
          <NavItem icon="📊" label="Stats" />
          <NavItem icon="👤" label="Profil" />
        </div>
      </nav>
    </main>
  )
}

function QuickAction({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center p-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 transition-colors"
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-sm text-neutral-300">{label}</span>
    </a>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-neutral-900">
      <p className="text-neutral-400 text-sm">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}

function NavItem({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) {
  return (
    <button className={`flex flex-col items-center gap-1 ${active ? 'text-white' : 'text-neutral-500'}`}>
      <span className="text-xl">{icon}</span>
      <span className="text-xs">{label}</span>
    </button>
  )
}
