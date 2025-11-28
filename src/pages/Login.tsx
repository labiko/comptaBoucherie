import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { login } from '../lib/auth';
import './Login.css';

export function Login() {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(loginInput, password);

      if (user) {
        setUser(user);
        navigate('/');
      } else {
        showError('Login ou mot de passe incorrect');
      }
    } catch (err) {
      showError('Une erreur est survenue lors de la connexion');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🥩</div>
          <h1 className="login-title">Compta Boucherie</h1>
          <p className="login-subtitle">Connexion</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label htmlFor="login">Identifiant</label>
            <input
              type="text"
              id="login"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="Votre identifiant"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="login-footer">
          <small>Identifiants par défaut : admin / admin123</small>
        </div>
      </div>
    </div>
  );
}
