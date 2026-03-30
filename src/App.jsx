import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './index.css'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'xsecklouex@gmail.com'

function PrivateRoute({ children }) {
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email === ADMIN_EMAIL) setStatus('ok')
      else setStatus('denied')
    })
  }, [])
  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
  if (status === 'denied') return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
