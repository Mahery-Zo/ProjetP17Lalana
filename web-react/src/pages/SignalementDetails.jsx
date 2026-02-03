import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signalementService } from '../services/api'
import './SignalementDetails.css'

export default function SignalementDetails() {
  const { id } = useParams()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [signalement, setSignalement] = useState(null)
  const [entreprises, setEntreprises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form states
  const [status, setStatus] = useState('')
  const [surfaceM2, setSurfaceM2] = useState('')
  const [budget, setBudget] = useState('')
  const [entrepriseId, setEntrepriseId] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadSignalement()
    loadEntreprises()
  }, [id])

  const loadEntreprises = async () => {
    try {
      const data = await signalementService.getEntreprises()
      setEntreprises(data)
    } catch (err) {
      console.error('Erreur de chargement des entreprises', err)
    }
  }

  const loadSignalement = async () => {
    try {
      const data = await signalementService.getById(id)
      setSignalement(data)
      setStatus(data.status || 'nouveau')
      setSurfaceM2(data.surface_m2 || '')
      setBudget(data.budget || '')
      setEntrepriseId(data.entreprise_id || '')
    } catch (err) {
      setError('Erreur de chargement du signalement')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setError('')
    setSuccess('')

    try {
      await signalementService.updateStatus(id, status)
      setSuccess('Statut mis à jour avec succès')
      loadSignalement()
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateDetails = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setError('')
    setSuccess('')

    try {
      await signalementService.updateDetails(id, {
        surface_m2: surfaceM2 ? parseFloat(surfaceM2) : null,
        budget: budget ? parseFloat(budget) : null,
        entreprise_id: entrepriseId || null
      })
      setSuccess('Détails mis à jour avec succès')
      loadSignalement()
    } catch (err) {
      setError('Erreur lors de la mise à jour des détails')
    } finally {
      setUpdating(false)
    }
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

  if (loading) {
    return <div className="loading-page">Chargement...</div>
  }

  if (!signalement) {
    return <div className="error-page">Signalement introuvable</div>
  }

  return (
    <div className="signalement-details">
      <nav className="navbar">
        <h1>Lalana</h1>
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
        <div className="header">
          <h2>Détails du signalement #{signalement.id}</h2>
          <button onClick={() => navigate('/signalements')} className="btn-back">
            ← Retour
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="details-grid">
          {/* Informations générales */}
          <div className="card">
            <h3>Informations générales</h3>
            <div className="info-row">
              <span className="label">Statut:</span>
              <span 
                className="status-badge" 
                style={{ backgroundColor: getStatusColor(signalement.status) }}
              >
                {getStatusLabel(signalement.status)}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Description:</span>
              <span>{signalement.description || 'Aucune description'}</span>
            </div>
            <div className="info-row">
              <span className="label">Localisation:</span>
              <span>📍 {signalement.latitude}, {signalement.longitude}</span>
            </div>
            <div className="info-row">
              <span className="label">Signalé par:</span>
              <span>{signalement.user?.name || 'Inconnu'}</span>
            </div>
            <div className="info-row">
              <span className="label">Date:</span>
              <span>{new Date(signalement.created_at).toLocaleString('fr-FR')}</span>
            </div>
            {signalement.photo_url && (
              <div className="info-row">
                <span className="label">Photo:</span>
                <a href={signalement.photo_url} target="_blank" rel="noopener noreferrer">
                  Voir la photo
                </a>
              </div>
            )}
          </div>

          {/* Détails techniques */}
          <div className="card">
            <h3>Détails techniques</h3>
            <div className="info-row">
              <span className="label">Surface (m²):</span>
              <span>{signalement.surface_m2 ? `${signalement.surface_m2} m²` : 'Non renseigné'}</span>
            </div>
            <div className="info-row">
              <span className="label">Budget:</span>
              <span>{signalement.budget ? `${signalement.budget.toLocaleString('fr-FR')} Ar` : 'Non renseigné'}</span>
            </div>
            <div className="info-row">
              <span className="label">Entreprise:</span>
              <span>{signalement.entreprise?.nom || 'Non renseigné'}</span>
            </div>
          </div>
        </div>

        {/* Formulaires de mise à jour (Manager uniquement) */}
        {user?.role === 'manager' && (
          <div className="update-forms">
            <div className="card">
              <h3>Mettre à jour le statut</h3>
              <form onSubmit={handleUpdateStatus}>
                <div className="form-group">
                  <label>Statut</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={updating}
                  >
                    <option value="nouveau">Nouveau</option>
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                  </select>
                </div>
                <button type="submit" disabled={updating} className="btn-submit">
                  {updating ? 'Mise à jour...' : 'Mettre à jour le statut'}
                </button>
              </form>
            </div>

            <div className="card">
              <h3>Compléter les détails</h3>
              <form onSubmit={handleUpdateDetails}>
                <div className="form-group">
                  <label>Surface (m²)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={surfaceM2}
                    onChange={(e) => setSurfaceM2(e.target.value)}
                    placeholder="Ex: 150.5"
                    disabled={updating}
                  />
                </div>

                <div className="form-group">
                  <label>Budget (Ariary)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="Ex: 5000000"
                    disabled={updating}
                  />
                </div>

                <div className="form-group">
                  <label>Entreprise</label>
                  <select
                    value={entrepriseId}
                    onChange={(e) => setEntrepriseId(e.target.value)}
                    disabled={updating}
                  >
                    <option value="">-- Sélectionner une entreprise --</option>
                    {entreprises.map((ent) => (
                      <option key={ent.id} value={ent.id}>
                        {ent.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" disabled={updating} className="btn-submit">
                  {updating ? 'Mise à jour...' : 'Enregistrer les détails'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
