import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signalementService } from '../services/api'
import './MapView.css'

export default function MapView() {
  const [signalements, setSignalements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hoveredSignalement, setHoveredSignalement] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    totalSurface: 0,
    totalBudget: 0,
    nouveau: 0,
    enCours: 0,
    termine: 0,
    avancement: 0
  })
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadSignalements()
  }, [])

  const loadSignalements = async () => {
    try {
      const data = await signalementService.getAll()
      setSignalements(data)
      calculateStats(data)
    } catch (err) {
      setError('Erreur de chargement des signalements')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data) => {
    const total = data.length
    const nouveau = data.filter(s => s.current_status === 'nouveau').length
    const enCours = data.filter(s => s.current_status === 'en_cours').length
    const termine = data.filter(s => s.current_status === 'termine').length
    
    const totalSurface = data.reduce((sum, s) => sum + (parseFloat(s.surface_m2) || 0), 0)
    const totalBudget = data.reduce((sum, s) => sum + (parseFloat(s.budget) || 0), 0)
    
    // Avancement basé sur les valeurs du backend (nouveau=0, en_cours=50, termine=100)
    const totalAvancement = data.reduce((sum, s) => sum + (s.avancement || 0), 0)
    const avancement = total > 0 ? Math.round(totalAvancement / total) : 0

    setStats({
      total,
      totalSurface,
      totalBudget,
      nouveau,
      enCours,
      termine,
      avancement
    })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getStatusLabel = (status) => {
    const labels = {
      'nouveau': 'Nouveau',
      'en_cours': 'En cours',
      'termine': 'Terminé'
    }
    return labels[status] || status
  }

  const getStatusColor = (status) => {
    const colors = {
      'nouveau': '#ffc107',
      'en_cours': '#17a2b8',
      'termine': '#28a745'
    }
    return colors[status] || '#6c757d'
  }

  const getMarkerPosition = (index, total) => {
    // Disposition en grille pour simuler une carte
    const cols = Math.ceil(Math.sqrt(total))
    const row = Math.floor(index / cols)
    const col = index % cols
    
    return {
      top: `${(row * 100 / Math.ceil(total / cols)) + 10}%`,
      left: `${(col * 100 / cols) + 5}%`
    }
  }

  if (loading) {
    return <div className="loading-page">Chargement de la carte...</div>
  }

  return (
    <div className="map-view">
      <nav className="navbar">
        <h1>Lalana - Carte des signalements</h1>
        <div className="nav-right">
          {user ? (
            <>
              <button onClick={() => navigate('/dashboard')} className="btn-nav">
                Dashboard
              </button>
              <button onClick={() => navigate('/signalements')} className="btn-nav">
                Liste
              </button>
              {user.role === 'manager' && (
                <button onClick={() => navigate('/users')} className="btn-nav">
                  Utilisateurs
                </button>
              )}
              <span className="user-info">{user.name}</span>
              <button onClick={handleLogout} className="btn-logout">
                Déconnexion
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} className="btn-nav">
              Connexion
            </button>
          )}
        </div>
      </nav>

      <div className="map-container">
        {/* Tableau de récapitulation */}
        <div className="stats-panel">
          <h3>📊 Récapitulatif</h3>
          
          <div className="stat-card">
            <div className="stat-label">Nombre de signalements</div>
            <div className="stat-value">{stats.total}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Surface totale</div>
            <div className="stat-value">{stats.totalSurface.toLocaleString('fr-FR')} m²</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Budget total</div>
            <div className="stat-value">{stats.totalBudget.toLocaleString('fr-FR')} Ar</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Avancement</div>
            <div className="stat-value">{stats.avancement}%</div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${stats.avancement}%` }}
              ></div>
            </div>
          </div>

          <div className="status-breakdown">
            <h4>Par statut</h4>
            <div className="status-item">
              <span className="status-dot" style={{ backgroundColor: '#ffc107' }}></span>
              <span>Nouveau: {stats.nouveau}</span>
            </div>
            <div className="status-item">
              <span className="status-dot" style={{ backgroundColor: '#17a2b8' }}></span>
              <span>En cours: {stats.enCours}</span>
            </div>
            <div className="status-item">
              <span className="status-dot" style={{ backgroundColor: '#28a745' }}></span>
              <span>Terminé: {stats.termine}</span>
            </div>
          </div>
        </div>

        {/* Carte avec marqueurs */}
        <div className="map-area">
          <div className="map-title">🗺️ Carte de Madagascar</div>
          
          {error && <div className="error-message">{error}</div>}

          <div className="map-canvas">
            {signalements.map((sig, index) => (
              <div
                key={sig.id}
                className="marker"
                style={{
                  ...getMarkerPosition(index, signalements.length),
                  backgroundColor: getStatusColor(sig.current_status)
                }}
                onMouseEnter={() => setHoveredSignalement(sig)}
                onMouseLeave={() => setHoveredSignalement(null)}
                onClick={() => navigate(`/signalements/${sig.id}`)}
              >
                <span className="marker-icon">📍</span>
              </div>
            ))}

            {/* Tooltip au survol */}
            {hoveredSignalement && (
              <div 
                className="tooltip"
                style={{
                  top: `${getMarkerPosition(
                    signalements.indexOf(hoveredSignalement), 
                    signalements.length
                  ).top}`,
                  left: `${getMarkerPosition(
                    signalements.indexOf(hoveredSignalement), 
                    signalements.length
                  ).left}`
                }}
              >
                <div className="tooltip-header">
                  <strong>Signalement #{hoveredSignalement.id}</strong>
                  <span 
                    className="tooltip-status"
                    style={{ backgroundColor: getStatusColor(hoveredSignalement.current_status) }}
                  >
                    {getStatusLabel(hoveredSignalement.current_status)}
                  </span>
                </div>
                
                <div className="tooltip-content">
                  <div className="tooltip-row">
                    <span className="tooltip-label">📅 Date:</span>
                    <span>{new Date(hoveredSignalement.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  
                  <div className="tooltip-row">
                    <span className="tooltip-label">📏 Surface:</span>
                    <span>
                      {hoveredSignalement.surface_m2 
                        ? `${hoveredSignalement.surface_m2} m²` 
                        : 'Non renseigné'}
                    </span>
                  </div>
                  
                  <div className="tooltip-row">
                    <span className="tooltip-label">💰 Budget:</span>
                    <span>
                      {hoveredSignalement.budget 
                        ? `${parseFloat(hoveredSignalement.budget).toLocaleString('fr-FR')} Ar` 
                        : 'Non renseigné'}
                    </span>
                  </div>
                  
                  <div className="tooltip-row">
                    <span className="tooltip-label">🏢 Entreprise:</span>
                    <span>
                      {hoveredSignalement.entreprise?.nom || 'Non assignée'}
                    </span>
                  </div>
                  
                  <div className="tooltip-row">
                    <span className="tooltip-label">📍 Position:</span>
                    <span>{hoveredSignalement.latitude}, {hoveredSignalement.longitude}</span>
                  </div>
                </div>
                
                <div className="tooltip-footer">
                  Cliquez pour voir les détails
                </div>
              </div>
            )}
          </div>

          {signalements.length === 0 && (
            <div className="no-data">Aucun signalement à afficher</div>
          )}
        </div>
      </div>
    </div>
  )
}
