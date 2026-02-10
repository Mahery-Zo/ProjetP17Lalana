import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { syncService, pushService, pushUserService ,statisticsService } from '../services/api'

import './Dashboard.css'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await statisticsService.getStats()
      setStats(data)
    } catch (err) {
      console.error('Erreur chargement statistiques', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }


  const handleSync = async () => {
    try {
      const res = await syncService.syncFirebase()
      const res2 = await pushService.pushFirebase()
      const res3 = await pushUserService.pushUserFirebase()
      alert(res.message || 'Synchronisation terminée')
      alert(res2.message || 'Push terminée')
      alert(res3.message || 'Push terminée')
    } catch (err) {
      alert('Erreur lors de la synchronisation')
      console.error(err)
    }
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h1>Lalana</h1>
        <div className="nav-right">
          <span className="user-info">
            {user?.name} ({user?.role})
          </span>
          <button onClick={handleLogout} className="btn-logout">
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Bienvenue, {user?.name} !</h2>
          <p>Email: {user?.email}</p>
          <p>Rôle: <span className="badge">{user?.role}</span></p>
        </div>

        {/* Tableau récapitulatif */}
        {!loadingStats && stats && (
          <div className="stats-section">
            <h3>📊 Tableau récapitulatif</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Nb de signalements</div>
                <div className="stat-value">{stats.nb_signalements}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Surface totale</div>
                <div className="stat-value">{parseFloat(stats.total_surface_m2 || 0).toLocaleString('fr-FR')} m²</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avancement moyen</div>
                <div className="stat-value">{stats.avancement_moyen}%</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${stats.avancement_moyen}%` }}></div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Budget total</div>
                <div className="stat-value">{parseFloat(stats.total_budget || 0).toLocaleString('fr-FR')} Ar</div>
              </div>
            </div>

            {/* Par statut */}
            <div className="status-breakdown-dashboard">
              <div className="status-item-dash">
                <span className="dot" style={{ backgroundColor: '#ffc107' }}></span>
                Nouveau: {stats.par_status?.nouveau || 0}
              </div>
              <div className="status-item-dash">
                <span className="dot" style={{ backgroundColor: '#17a2b8' }}></span>
                En cours: {stats.par_status?.en_cours || 0}
              </div>
              <div className="status-item-dash">
                <span className="dot" style={{ backgroundColor: '#28a745' }}></span>
                Terminé: {stats.par_status?.termine || 0}
              </div>
            </div>

            {/* Délai moyen de traitement (manager) */}
            {user?.role === 'manager' && (
              <div className="delai-section">
                <h3>⏱️ Statistiques de traitement</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Délai moyen de traitement</div>
                    <div className="stat-value">
                      {stats.delai_moyen_jours !== null
                        ? `${stats.delai_moyen_jours} jours`
                        : 'Aucun signalement terminé'}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Signalements terminés</div>
                    <div className="stat-value">{stats.nb_termines || 0}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="actions">
          <button
            onClick={() => navigate('/map')}
            className="btn-primary"
          >
            🗺️ Voir la carte
          </button>

          <button
            onClick={() => navigate('/signalements')}
            className="btn-primary"
          >
            Voir les signalements
          </button>

          {user?.role === 'manager' && (
            <><button
              onClick={() => navigate('/users')}
              className="btn-primary"
            >
              Gérer les utilisateurs
            </button><button onClick={handleSync}>
                🔄 Synchroniser Firebase
              </button></>

          )}



        </div>
      </div>
    </div>
  )
}

