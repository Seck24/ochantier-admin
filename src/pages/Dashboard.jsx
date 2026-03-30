import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STATUS = {
  active:    { label: 'Actif',      bg: 'rgba(0,230,118,0.15)',  text: '#00e676',  border: 'rgba(0,230,118,0.3)' },
  trial:     { label: 'Essai',      bg: 'rgba(59,130,246,0.15)', text: '#60a5fa',  border: 'rgba(59,130,246,0.3)' },
  pending:   { label: 'En attente', bg: 'rgba(251,191,36,0.15)', text: '#fbbf24',  border: 'rgba(251,191,36,0.4)' },
  expired:   { label: 'Expiré',     bg: 'rgba(239,68,68,0.15)',  text: '#f87171',  border: 'rgba(239,68,68,0.3)' },
  cancelled: { label: 'Annulé',     bg: 'rgba(100,116,139,0.15)',text: '#94a3b8',  border: 'rgba(100,116,139,0.3)' },
}

const PLAN_COLORS = {
  solo:  { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' },
  equipe: { bg: 'rgba(168,85,247,0.12)', text: '#c084fc' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [activating, setActivating] = useState(false)
  const [toast, setToast] = useState(null)
  const [imgZoom, setImgZoom] = useState(false)

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, prenom, nom, nom_entreprise, role, subscription_status, plan, pending_plan, payment_screenshot_url, trial_started_at, reports_count, created_at, subscription_activated_at')
      .is('owner_id', null)
      .order('created_at', { ascending: false })
    if (!error) setUsers(data || [])
    setLoading(false)
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const activateUser = async (userId, plan) => {
    setActivating(true)
    try {
      const now = new Date().toISOString()
      const { error } = await supabase.from('profiles').update({
        subscription_status: 'active',
        plan: plan || 'solo',
        pending_plan: null,
        payment_screenshot_url: null,
        subscription_activated_at: now,
      }).eq('id', userId)
      if (error) throw error
      showToast(`Abonnement ${plan} activé !`)
      setSelected(null)
      await loadUsers()
    } catch (err) {
      showToast('Erreur : ' + err.message, 'error')
    } finally {
      setActivating(false)
    }
  }

  const expireUser = async (userId) => {
    if (!confirm('Marquer cet abonnement comme expiré ?')) return
    setActivating(true)
    try {
      const { error } = await supabase.from('profiles').update({
        subscription_status: 'expired',
      }).eq('id', userId)
      if (error) throw error
      showToast('Abonnement expiré.')
      setSelected(null)
      await loadUsers()
    } catch (err) {
      showToast('Erreur : ' + err.message, 'error')
    } finally {
      setActivating(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const filtered = filter === 'all' ? users
    : users.filter(u => {
        if (filter === 'trial') return !u.subscription_status || u.subscription_status === 'trial'
        return u.subscription_status === filter
      })

  const counts = {
    all: users.length,
    pending: users.filter(u => u.subscription_status === 'pending').length,
    active: users.filter(u => u.subscription_status === 'active').length,
    trial: users.filter(u => !u.subscription_status || u.subscription_status === 'trial').length,
    expired: users.filter(u => u.subscription_status === 'expired').length,
  }

  const glassStyle = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a1628' }}>

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl"
          style={{
            background: toast.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(0,230,118,0.9)',
            backdropFilter: 'blur(20px)',
            color: toast.type === 'error' ? 'white' : '#0a1628',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div
        className="sticky top-0 z-40 px-4 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(10,22,40,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
            style={{
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.35)',
              color: '#60a5fa',
              boxShadow: '0 0 20px rgba(59,130,246,0.15)',
            }}
          >
            Ô
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Ochantier Admin</p>
            <p className="text-white/40 text-xs">{users.length} utilisateurs</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
        >
          Déconnexion
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 pt-4 pb-2 flex gap-2 overflow-x-auto">
        {[
          { key: 'all',     label: 'Tous',       color: 'rgba(255,255,255,0.6)' },
          { key: 'pending', label: '⏳ Attente',  color: '#fbbf24' },
          { key: 'active',  label: '✓ Actifs',   color: '#00e676' },
          { key: 'trial',   label: 'Essai',       color: '#60a5fa' },
          { key: 'expired', label: 'Expirés',     color: '#f87171' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={filter === f.key
              ? { background: f.color === '#fbbf24' ? 'rgba(251,191,36,0.2)' : f.color === '#00e676' ? 'rgba(0,230,118,0.2)' : f.color === '#60a5fa' ? 'rgba(59,130,246,0.2)' : f.color === '#f87171' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)', color: f.color, border: `1px solid ${f.color}40` }
              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {/* Pending alert */}
      {counts.pending > 0 && (
        <div
          className="mx-4 mt-2 mb-1 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm font-semibold"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}
        >
          <span className="text-base">⏳</span>
          {counts.pending} paiement{counts.pending > 1 ? 's' : ''} en attente de validation
        </div>
      )}

      {/* User list */}
      <div className="px-4 pt-2 pb-24 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">Aucun utilisateur</div>
        ) : filtered.map(user => {
          const statusKey = user.subscription_status || 'trial'
          const badge = STATUS[statusKey] || STATUS.trial
          const name = [user.prenom, user.nom].filter(Boolean).join(' ') || 'Inconnu'
          const isPending = statusKey === 'pending'
          const planColor = PLAN_COLORS[user.pending_plan || user.plan] || PLAN_COLORS.solo

          return (
            <button
              key={user.id}
              onClick={() => setSelected(user)}
              className="w-full text-left rounded-2xl p-4 transition-all active:scale-98 relative overflow-hidden"
              style={{
                ...glassStyle,
                border: isPending ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: isPending ? '0 0 20px rgba(251,191,36,0.08)' : 'none',
              }}
            >
              {/* Shimmer top */}
              <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />

              {/* Pending glow */}
              {isPending && (
                <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(251,191,36,0.1) 0%, transparent 70%)' }} />
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-white truncate">{name}</p>
                    {isPending && (
                      <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>
                        À valider
                      </span>
                    )}
                  </div>
                  <p className="text-white/50 text-xs truncate">{user.nom_entreprise || 'Sans entreprise'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: planColor.bg, color: planColor.text }}>
                      {(user.pending_plan || user.plan || 'solo').toUpperCase()}
                    </span>
                    <span className="text-white/30 text-xs">{user.reports_count || 0} rapports</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}>
                    {badge.label}
                  </span>
                  {user.payment_screenshot_url && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(251,191,36,0.4)' }}>
                      <img src={user.payment_screenshot_url} alt="preuve" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => { setSelected(null); setImgZoom(false) }}
        >
          <div
            className="w-full max-w-lg mx-auto rounded-t-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            style={{
              background: 'rgba(15,30,56,0.97)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderBottom: 'none',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full mx-auto" style={{ background: 'rgba(255,255,255,0.15)' }} />

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white text-xl">
                  {[selected.prenom, selected.nom].filter(Boolean).join(' ') || 'Inconnu'}
                </h3>
                <p className="text-white/40 text-sm mt-0.5">{selected.nom_entreprise || 'Sans entreprise'}</p>
              </div>
              <button
                onClick={() => { setSelected(null); setImgZoom(false) }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/50"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                ×
              </button>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Statut', value: (STATUS[selected.subscription_status] || STATUS.trial).label },
                { label: 'Formule', value: (selected.pending_plan || selected.plan || 'solo').toUpperCase() },
                { label: 'Rapports', value: selected.reports_count || 0 },
                { label: 'Inscrit le', value: new Date(selected.created_at).toLocaleDateString('fr-FR') },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-white/40 text-xs mb-1">{item.label}</p>
                  <p className="font-bold text-white text-sm">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Payment screenshot */}
            {selected.payment_screenshot_url && (
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: '#fbbf24' }}>
                  Preuve de paiement Wave
                </p>
                <div
                  className="rounded-2xl overflow-hidden cursor-pointer"
                  style={{ border: '1px solid rgba(251,191,36,0.3)' }}
                  onClick={() => setImgZoom(!imgZoom)}
                >
                  <img
                    src={selected.payment_screenshot_url}
                    alt="Preuve paiement"
                    className="w-full object-contain transition-all"
                    style={{ maxHeight: imgZoom ? '70vh' : '220px', background: 'rgba(0,0,0,0.3)' }}
                  />
                </div>
                <p className="text-white/30 text-xs text-center mt-1">Appuie pour agrandir</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pb-2">
              {selected.subscription_status === 'pending' && (
                <>
                  <button
                    onClick={() => activateUser(selected.id, selected.pending_plan || 'solo')}
                    disabled={activating}
                    className="w-full font-bold py-4 rounded-2xl text-sm transition-all disabled:opacity-60"
                    style={{
                      background: 'rgba(0,230,118,0.15)',
                      border: '1px solid rgba(0,230,118,0.4)',
                      color: '#00e676',
                      boxShadow: activating ? 'none' : '0 0 20px rgba(0,230,118,0.1)',
                    }}
                  >
                    {activating ? 'Activation...' : `✅ Activer — ${(selected.pending_plan || 'solo').toUpperCase()}`}
                  </button>
                  <button
                    onClick={() => expireUser(selected.id)}
                    disabled={activating}
                    className="w-full font-bold py-3.5 rounded-2xl text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                  >
                    ❌ Refuser / Expirer
                  </button>
                </>
              )}

              {selected.subscription_status !== 'pending' && selected.subscription_status !== 'active' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => activateUser(selected.id, 'solo')}
                    disabled={activating}
                    className="flex-1 font-bold py-3.5 rounded-2xl text-sm"
                    style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', color: '#60a5fa' }}
                  >
                    Activer Solo
                  </button>
                  <button
                    onClick={() => activateUser(selected.id, 'equipe')}
                    disabled={activating}
                    className="flex-1 font-bold py-3.5 rounded-2xl text-sm"
                    style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc' }}
                  >
                    Activer Équipe
                  </button>
                </div>
              )}

              {selected.subscription_status === 'active' && (
                <button
                  onClick={() => expireUser(selected.id)}
                  disabled={activating}
                  className="w-full font-bold py-3.5 rounded-2xl text-sm"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                >
                  Désactiver l'abonnement
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
