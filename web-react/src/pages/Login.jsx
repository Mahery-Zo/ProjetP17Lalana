import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('manager@lalana.mg')
  const [password, setPassword] = useState('manager123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Lalana</h1>
        <h2>Connexion</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-link">
          Pas de compte ? <Link to="/register">S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
