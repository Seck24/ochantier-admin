import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STATUS_LABELS = {
  active: { label: 'Actif', bg: 'bg-green-100', text: 'text-green-700' },
  trial: { label: 'Essai', bg: 'bg-blue-100', text: 'text-blue-700' },
  pending: { label: 'En attente', bg: 'bg-amber-100', text: 'text-amber-700' },
  expired: { label: 'Expiré', bg: 'bg-red-100', text: 'text-red-700' },
  cancelled: { label: 'Annulé', bg: 'bg-gray-100', text: 'text-gray-600' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [activating, setActivating] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, prenom, nom, nom_entreprise, role, subscription_status, plan, pending_plan, payment_screenshot_url, trial_started_at, reports_count, created_at')
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
      showToast(`✅ Abonnement ${plan} activé !`)
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
    : filter === 'pending' ? users.filter(u => u.subscription_status === 'pending')
    : users.filter(u => u.subscription_status === filter)

  const pendingCount = users.filter(u => u.subscription_status === 'pending').length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">Ô</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">Ochantier Admin</h1>
            <p className="text-slate-400 text-xs">{users.length} utilisateurs</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-slate-400 text-sm">Déconnexion</button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 px-4 py-3 bg-white border-b border-slate-200 overflow-x-auto">
        {[
          { key: 'all', label: 'Tous', count: users.length },
          { key: 'pending', label: '⏳ En attente', count: users.filter(u => u.subscription_status === 'pending').length },
          { key: 'active', label: '✓ Actifs', count: users.filter(u => u.subscription_status === 'active').length },
          { key: 'trial', label: 'Essai', count: users.filter(u => u.subscription_status === 'trial' || !u.subscription_status).length },
          { key: 'expired', label: 'Expirés', count: users.filter(u => u.subscription_status === 'expired').length },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === f.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* User list */}
      <div className="px-4 py-3 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Aucun utilisateur dans cette catégorie</div>
        ) : filtered.map(user => {
          const status = user.subscription_status || 'trial'
          const badge = STATUS_LABELS[status] || STATUS_LABELS.trial
          const name = [user.prenom, user.nom].filter(Boolean).join(' ') || 'Inconnu'
          return (
            <button
              key={user.id}
              onClick={() => setSelected(user)}
              className={`w-full text-left bg-white rounded-2xl px-4 py-4 border transition-all active:scale-98 ${
                status === 'pending' ? 'border-amber-300 shadow-amber-100 shadow-md' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800">{name}</p>
                    {status === 'pending' && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">À valider</span>}
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">{user.nom_entreprise || 'Sans entreprise'} · {user.plan || 'solo'}</p>
                  <p className="text-slate-400 text-xs">{user.reports_count || 0} rapports</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-lg">
                {[selected.prenom, selected.nom].filter(Boolean).join(' ')}
              </h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-2xl">×</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs mb-1">Entreprise</p>
                <p className="font-semibold text-gray-800">{selected.nom_entreprise || '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs mb-1">Formule demandée</p>
                <p className="font-semibold text-gray-800">{selected.pending_plan || selected.plan || 'solo'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs mb-1">Rapports</p>
                <p className="font-semibold text-gray-800">{selected.reports_count || 0}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs mb-1">Inscrit le</p>
                <p className="font-semibold text-gray-800">{new Date(selected.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            {/* Capture de paiement */}
            {selected.payment_screenshot_url && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Preuve de paiement Wave</p>
                <img
                  src={selected.payment_screenshot_url}
                  alt="Preuve paiement"
                  className="w-full rounded-xl border border-slate-200 max-h-64 object-contain bg-slate-50"
                />
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {selected.subscription_status === 'pending' && (
                <>
                  <button
                    onClick={() => activateUser(selected.id, selected.pending_plan || 'solo')}
                    disabled={activating}
                    className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl text-sm"
                  >
                    {activating ? 'Activation...' : `✅ Activer — ${selected.pending_plan || 'solo'}`}
                  </button>
                  <button
                    onClick={() => expireUser(selected.id)}
                    disabled={activating}
                    className="w-full bg-red-50 text-red-600 font-bold py-3.5 rounded-xl text-sm border border-red-200"
                  >
                    ❌ Refuser / Expirer
                  </button>
                </>
              )}

              {selected.subscription_status !== 'pending' && selected.subscription_status !== 'active' && (
                <div className="flex gap-3">
                  <button onClick={() => activateUser(selected.id, 'solo')} disabled={activating} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl text-sm">
                    Activer Solo
                  </button>
                  <button onClick={() => activateUser(selected.id, 'equipe')} disabled={activating} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl text-sm">
                    Activer Équipe
                  </button>
                </div>
              )}

              {selected.subscription_status === 'active' && (
                <button onClick={() => expireUser(selected.id)} disabled={activating} className="w-full bg-red-50 text-red-600 font-bold py-3.5 rounded-xl text-sm border border-red-200">
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
