import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Tableau de bord',
  '/crm': 'CRM — Leads',
  '/participants': 'Participants',
  '/coaching/packs': 'Packs de coaching',
  '/coaching/sessions': 'Séances de coaching',
  '/training': 'Formations',
  '/payments': 'Paiements',
  '/recu-paiement': 'Reçus de paiement',
  '/calendar': 'Calendrier',
  '/tests': 'Tests psychométriques',
  '/documents': 'Documents',
  '/certificates': 'Certificats',
  '/tasks': 'Tâches',
  '/reports': 'Rapports',
  '/settings': 'Paramètres',
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || ''

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <TopBar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-5 md:p-6 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
