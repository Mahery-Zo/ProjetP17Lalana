import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { syncService, pushService } from '../services/api'
import './Dashboard.css'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }


  const handleSync = async () => {
  try {
    const res = await syncService.syncFirebase()
    const res2 = await pushService.pushFirebase()
    alert(res.message || 'Synchronisation terminée')
    alert(res2.message || 'Push terminée')
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

