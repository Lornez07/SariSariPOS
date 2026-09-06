import { NavLink } from 'react-router-dom'

const tabs = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/paninda', label: 'Paninda', icon: '📦' },
  { path: '/benta', label: 'Benta', icon: '🛒' },
  { path: '/utang', label: 'Utang', icon: '📒' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 flex justify-around items-center h-[64px] pb-safe z-50">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors ${
              isActive ? 'text-violet-600 bg-violet-50' : 'text-zinc-500 hover:text-zinc-700'
            }`
          }
        >
          <span className="text-[20px] leading-none mb-1">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
