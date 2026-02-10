import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signalementService } from '../services/api'
import './Signalements.css'

export default function Signalements() {
  const [signalements, setSignalements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadSignalements()
  }, [])

  const loadSignalements = async () => {
    try {
      const data = await signalementService.getAll()
      setSignalements(data)
    } catch (err) {
      setError('Erreur de chargement des signalements')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="signalements-page">
      <nav className="navbar">
        <h1>Lalana</h1>
        <div className="nav-right">
          <button onClick={() => navigate('/map')} className="btn-nav">
            Carte
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-nav">
            Dashboard
          </button>
          {user?.role === 'manager' && (
            <button onClick={() => navigate('/users')} className="btn-nav">
              Utilisateurs
            </button>
          )}
          <span className="user-info">{user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="content">
        <h2>Signalements</h2>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div className="signalements-grid">
            {signalements.map((sig) => (
              <div 
                key={sig.id} 
                className="signalement-card"
                onClick={() => navigate(`/signalements/${sig.id}`)}
              >
                <div className="card-header">
                  <span className={`status status-${sig.current_status}`}>
                    {sig.current_status}
                  </span>
                  <span className="date">
                    {new Date(sig.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="description">{sig.description}</p>
                <div className="location">
                  📍 {sig.latitude}, {sig.longitude}
                </div>
                {sig.user && (
                  <div className="reporter">
                    Signalé par: {sig.user.name}
                  </div>
                )}
                <div className="view-details">
                  Voir les détails →
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && signalements.length === 0 && (
          <p className="no-data">Aucun signalement trouvé</p>
        )}
      </div>
    </div>
  )
}
