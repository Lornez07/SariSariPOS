import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Paninda from './pages/Paninda'
import Benta from './pages/Benta'
import Utang from './pages/Utang'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-50 pb-[64px]">
        <header className="sticky top-0 bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-2 z-40">
          <span className="text-xl">🏪</span>
          <span className="font-bold text-zinc-900">SariSariPOS</span>
          <span className="ml-auto text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">v1 MVP</span>
        </header>

        <main className="max-w-[480px] mx-auto bg-white min-h-[calc(100vh-64px-56px)]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/paninda" element={<Paninda />} />
            <Route path="/benta" element={<Benta />} />
            <Route path="/utang" element={<Utang />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </BrowserRouter>
  )
}

export default App
