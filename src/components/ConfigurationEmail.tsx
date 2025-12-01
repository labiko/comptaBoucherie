import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Boucherie } from '../types';
import './ConfigurationEmail.css';

export function ConfigurationEmail() {
  const { user } = useAuth();
  const [boucherie, setBoucherie] = useState<Boucherie | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // Messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Formulaire
  const [formData, setFormData] = useState({
    smtp_email: '',
    smtp_password: '',
    email_comptable: ''
  });

  useEffect(() => {
    loadBoucherie();
  }, [user]);

  async function loadBoucherie() {
    if (!user?.boucherie_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('boucheries')
        .select('*')
        .eq('id', user.boucherie_id)
        .single();

      if (error) throw error;

      const boucherieData = data as Boucherie;
      setBoucherie(boucherieData);
      setFormData({
        smtp_email: boucherieData.smtp_email || '',
        smtp_password: boucherieData.smtp_password || '',
        email_comptable: boucherieData.email_comptable || ''
      });
    } catch (error) {
      console.error('Erreur chargement boucherie:', error);
      setErrorMessage('Erreur lors du chargement de la configuration');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user?.boucherie_id) return;

    // Réinitialiser les messages
    setSuccessMessage('');
    setErrorMessage('');

    // Validation
    if (!formData.smtp_email || !formData.smtp_password || !formData.email_comptable) {
      setErrorMessage('Tous les champs sont obligatoires');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.smtp_email)) {
      setErrorMessage('Email Gmail invalide');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }
    if (!emailRegex.test(formData.email_comptable)) {
      setErrorMessage('Email comptable invalide');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('boucheries')
        .update({
          smtp_email: formData.smtp_email.trim(),
          smtp_password: formData.smtp_password.trim(),
          email_comptable: formData.email_comptable.trim()
        })
        .eq('id', user.boucherie_id);

      if (error) throw error;

      setSuccessMessage('Configuration enregistrée avec succès !');
      setTimeout(() => setSuccessMessage(''), 5000);
      await loadBoucherie();
    } catch (error) {
      console.error('Erreur sauvegarde configuration:', error);
      setErrorMessage('Erreur lors de la sauvegarde de la configuration');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="configuration-email">
      <div className="config-header">
        <h2>Configuration Email SMTP</h2>
        <p className="config-description">
          Configurez votre compte Gmail pour l'envoi automatique des factures au comptable
        </p>
      </div>

      {loading && <p className="loading">Chargement...</p>}

      {/* Messages de succès et d'erreur */}
      {successMessage && (
        <div className="message message-success">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="message message-error">
          {errorMessage}
        </div>
      )}

      {!loading && (
        <div className="config-content">
          {/* Instructions */}
          <div className="info-box">
            <div className="info-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Instructions importantes</span>
            </div>
            <ol className="info-list">
              <li>Créez un <strong>mot de passe d'application Gmail</strong> (pas votre mot de passe habituel)</li>
              <li>Allez sur <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">Google App Passwords</a></li>
              <li>Sélectionnez "Autre (nom personnalisé)" et donnez un nom (ex: "Boucherie Compta")</li>
              <li>Copiez le mot de passe généré (16 caractères) et collez-le ci-dessous</li>
            </ol>
          </div>

          {/* Formulaire */}
          <div className="config-form">
            <div className="form-section">
              <h3>Configuration SMTP Gmail</h3>

              <div className="form-group">
                <label>Email Gmail de la boucherie *</label>
                <input
                  type="email"
                  value={formData.smtp_email}
                  onChange={(e) => setFormData({ ...formData, smtp_email: e.target.value })}
                  placeholder="votre-boucherie@gmail.com"
                  disabled={loading}
                />
                <p className="field-hint">Cet email sera utilisé pour envoyer les factures</p>
              </div>

              <div className="form-group">
                <label>Mot de passe d'application Gmail *</label>
                <div className="password-input-group">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={formData.smtp_password}
                    onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                    placeholder="xxxx xxxx xxxx xxxx"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="btn-toggle-password"
                    title={showPasswords ? 'Masquer' : 'Afficher'}
                  >
                    {showPasswords ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12C2.73 7.61 7 4 12 4C17 4 21.27 7.61 23 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    )}
                  </button>
                </div>
                <p className="field-hint">Mot de passe de 16 caractères généré par Google</p>
              </div>
            </div>

            <div className="form-section">
              <h3>Email du comptable</h3>

              <div className="form-group">
                <label>Email du destinataire *</label>
                <input
                  type="email"
                  value={formData.email_comptable}
                  onChange={(e) => setFormData({ ...formData, email_comptable: e.target.value })}
                  placeholder="comptable@cabinet.fr"
                  disabled={loading}
                />
                <p className="field-hint">Les factures seront envoyées à cette adresse</p>
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                onClick={handleSave}
                disabled={loading || !formData.smtp_email || !formData.smtp_password || !formData.email_comptable}
                className="btn-save"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer la configuration'}
              </button>
            </div>
          </div>

          {/* Current Configuration Display */}
          {boucherie && (boucherie.smtp_email || boucherie.email_comptable) && (
            <div className="current-config">
              <h3>Configuration actuelle</h3>
              <div className="config-item">
                <span className="config-label">Email SMTP :</span>
                <span className="config-value">{boucherie.smtp_email || 'Non configuré'}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Email comptable :</span>
                <span className="config-value">{boucherie.email_comptable || 'Non configuré'}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Mot de passe :</span>
                <span className="config-value">
                  {boucherie.smtp_password ? '••••••••••••••••' : 'Non configuré'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
