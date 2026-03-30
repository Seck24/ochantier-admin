import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'xsecklouex@gmail.com'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email === ADMIN_EMAIL) navigate('/dashboard', { replace: true })
    })
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email !== ADMIN_EMAIL) {
        await supabase.auth.signOut()
        throw new Error('Accès non autorisé.')
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Identifiants incorrects.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    borderRadius: '14px',
    padding: '14px 16px',
    fontSize: '14px',
    width: '100%',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0a1628' }}>

      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,40,200,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.35)',
              boxShadow: '0 0 30px rgba(59,130,246,0.15)',
            }}
          >
            <span className="font-black text-2xl" style={{ color: '#60a5fa' }}>Ô</span>
          </div>
          <h1 className="text-white font-bold text-xl">Ochantier Admin</h1>
          <p className="text-white/40 text-sm mt-1">Accès réservé</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email admin"
            style={inputStyle}
            required
          />
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe"
              style={{ ...inputStyle, paddingRight: '48px' }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
            >
              {showPwd ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold py-4 rounded-2xl text-sm transition-all disabled:opacity-60 mt-2"
            style={{
              background: loading ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.2)',
              border: '1px solid rgba(59,130,246,0.5)',
              color: '#60a5fa',
              boxShadow: loading ? 'none' : '0 0 20px rgba(59,130,246,0.1)',
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
