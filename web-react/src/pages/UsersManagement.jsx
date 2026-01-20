import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userService } from '../services/api'
import './UsersManagement.css'

export default function UsersManagement() {
  const [blockedUsers, setBlockedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.role !== 'manager') {
      navigate('/dashboard')
      return
    }
    loadBlockedUsers()
  }, [user, navigate])

  const loadBlockedUsers = async () => {
    try {
      setError('')
      const data = await userService.getBlockedUsers()
      setBlockedUsers(data)
    } catch (err) {
      setError('Erreur de chargement des utilisateurs bloqués')
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async (userId, userName) => {
    if (!confirm(`Débloquer l'utilisateur ${userName} ?`)) {
      return
    }

    try {
      setError('')
      setSuccess('')
      await userService.unblockUser(userId)
      setSuccess(`${userName} a été débloqué avec succès`)
      loadBlockedUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du déblocage')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="users-management">
      <nav className="navbar">
        <h1>Lalana - Gestion des utilisateurs</h1>
        <div className="nav-right">
          <button onClick={() => navigate('/map')} className="btn-nav">
            Carte
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-nav">
            Dashboard
          </button>
          <button onClick={() => navigate('/signalements')} className="btn-nav">
            Signalements
          </button>
          <span className="user-info">{user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="content">
        <div className="header">
          <h2>Utilisateurs bloqués</h2>
          <button onClick={loadBlockedUsers} className="btn-refresh">
            🔄 Actualiser
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {loading ? (
          <p className="loading">Chargement...</p>
        ) : blockedUsers.length === 0 ? (
          <div className="no-data">
            <p>✅ Aucun utilisateur bloqué</p>
          </div>
        ) : (
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Date de création</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {blockedUsers.map((blockedUser) => (
                  <tr key={blockedUser.id}>
                    <td>{blockedUser.id}</td>
                    <td>{blockedUser.name}</td>
                    <td>{blockedUser.email}</td>
                    <td>
                      <span className={`role-badge role-${blockedUser.role}`}>
                        {blockedUser.role}
                      </span>
                    </td>
                    <td>
                      {new Date(blockedUser.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <button
                        onClick={() => handleUnblock(blockedUser.id, blockedUser.name)}
                        className="btn-unblock"
                      >
                        🔓 Débloquer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
