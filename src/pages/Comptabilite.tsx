import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Boucherie, Facture, Encaissement, EnvoiComptabilite } from '../types';
import { generateFacturesExcel, generateEncaissementsExcel, downloadExcel, generateExcelFilename } from '../lib/csv';
import { sendComptabiliteEmail, saveEnvoiComptabilite, getEnvoisHistory } from '../lib/email';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConfirmModal } from '../components/ConfirmModal';
import './Comptabilite.css';

export function Comptabilite() {
  const { user } = useAuth();
  const [boucherie, setBoucherie] = useState<Boucherie | null>(null);
  const [loading, setLoading] = useState(false);
  const [envoisHistory, setEnvoisHistory] = useState<EnvoiComptabilite[]>([]);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailComptable, setEmailComptable] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sélection du mois/année
  const currentDate = new Date();
  const [selectedMois, setSelectedMois] = useState(currentDate.getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(currentDate.getFullYear());

  // Prévisualisation des données
  const [factures, setFactures] = useState<Facture[]>([]);
  const [encaissements, setEncaissements] = useState<Encaissement[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const moisNoms = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  useEffect(() => {
    loadBoucherie();
    loadEnvoisHistory();
  }, [user]);

  async function loadBoucherie() {
    if (!user?.boucherie_id) return;

    const { data } = await supabase
      .from('boucheries')
      .select('*')
      .eq('id', user.boucherie_id)
      .single();

    if (data) {
      setBoucherie(data as Boucherie);
      setEmailComptable(data.email_comptable || '');
    }
  }

  async function handleSaveEmail() {
    if (!user?.boucherie_id) return;

    try {
      const { error } = await supabase
        .from('boucheries')
        .update({ email_comptable: emailComptable })
        .eq('id', user.boucherie_id);

      if (error) throw error;

      // Recharger les données de la boucherie
      await loadBoucherie();
      setIsEditingEmail(false);
    } catch (error) {
      console.error('Erreur sauvegarde email:', error);
      alert('Erreur lors de la sauvegarde de l\'email');
    }
  }

  async function loadEnvoisHistory() {
    if (!user?.boucherie_id) return;

    const result = await getEnvoisHistory(user.boucherie_id);
    if (result.success && result.envois) {
      setEnvoisHistory(result.envois);
    }
  }

  async function loadFacturesPreview() {
    if (!user?.boucherie_id) return;

    setLoading(true);

    try {
      // Calculer les dates de début et fin du mois
      const startDate = new Date(selectedAnnee, selectedMois - 1, 1);
      const endDate = new Date(selectedAnnee, selectedMois, 0);

      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('factures')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .gte('date_facture', startDateStr)
        .lte('date_facture', endDateStr)
        .order('date_facture', { ascending: true });

      if (error) throw error;

      setFactures((data as Facture[]) || []);

      // Charger aussi les encaissements
      await loadEncaissementsPreview();

      setShowPreview(true);

    } catch (error) {
      console.error('Erreur chargement factures:', error);
      alert('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  }

  async function loadEncaissementsPreview() {
    if (!user?.boucherie_id) return;

    setLoading(true);

    try {
      // Calculer les dates de début et fin du mois
      const startDate = new Date(selectedAnnee, selectedMois - 1, 1);
      const endDate = new Date(selectedAnnee, selectedMois, 0);

      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('encaissements')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: true });

      if (error) throw error;

      setEncaissements((data as Encaissement[]) || []);

    } catch (error) {
      console.error('Erreur chargement encaissements:', error);
      alert('Erreur lors du chargement des encaissements');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenConfirmModal() {
    if (!boucherie?.email_comptable) {
      alert('Aucun email comptable configuré pour cette boucherie.\nVeuillez configurer l\'email dans les paramètres de la boucherie.');
      return;
    }

    if (factures.length === 0) {
      alert('Aucune facture à envoyer pour cette période.');
      return;
    }

    setShowConfirmModal(true);
  }

  async function handleGenerateAndSend() {
    setShowConfirmModal(false);
    if (!user?.boucherie_id || !boucherie) return;

    setLoading(true);

    try {
      // Vérifier que l'email comptable est configuré
      if (!boucherie.email_comptable) {
        setErrorMessage('Veuillez configurer l\'email comptable dans les paramètres');
        setShowErrorModal(true);
        setLoading(false);
        return;
      }

      // Vérifier que les credentials SMTP sont configurés
      if (!boucherie.smtp_email || !boucherie.smtp_password) {
        setErrorMessage('Configuration SMTP manquante. Veuillez configurer votre email Gmail et mot de passe d\'application dans Administration > Configuration Email');
        setShowErrorModal(true);
        setLoading(false);
        return;
      }

      // Générer l'Excel des factures
      const facturesExcelBuffer = generateFacturesExcel(factures, boucherie.nom, selectedMois, selectedAnnee);
      const facturesFilename = generateExcelFilename(boucherie.nom, selectedMois, selectedAnnee, 'factures');
      const facturesBase64 = btoa(
        new Uint8Array(facturesExcelBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Générer l'Excel des encaissements
      const encaissementsExcelBuffer = generateEncaissementsExcel(encaissements, boucherie.nom, selectedMois, selectedAnnee);
      const encaissementsFilename = generateExcelFilename(boucherie.nom, selectedMois, selectedAnnee, 'encaissements');
      const encaissementsBase64 = btoa(
        new Uint8Array(encaissementsExcelBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Préparer les attachments
      const attachments = [
        { base64: facturesBase64, filename: facturesFilename },
        { base64: encaissementsBase64, filename: encaissementsFilename }
      ];

      // Calculer les totaux
      const totalFactures = factures.reduce((sum, f) => sum + f.montant, 0);
      const totalEncaissements = encaissements.reduce((sum, e) => sum + e.total, 0);

      // Calculer les statistiques des factures par fournisseur
      const facturesParFournisseur: { [key: string]: { count: number; total: number } } = {};
      factures.forEach(f => {
        if (!facturesParFournisseur[f.fournisseur]) {
          facturesParFournisseur[f.fournisseur] = { count: 0, total: 0 };
        }
        facturesParFournisseur[f.fournisseur].count++;
        facturesParFournisseur[f.fournisseur].total += f.montant;
      });

      // Envoyer l'email avec les 2 fichiers et les totaux
      const emailResult = await sendComptabiliteEmail(
        boucherie.email_comptable,
        attachments,
        selectedMois,
        selectedAnnee,
        boucherie.nom,
        boucherie.smtp_email,
        boucherie.smtp_password,
        {
          totalFactures,
          totalEncaissements,
          facturesParFournisseur
        }
      );

      // Enregistrer les 2 envois dans la base
      await saveEnvoiComptabilite(
        user.boucherie_id,
        'factures',
        selectedMois,
        selectedAnnee,
        boucherie.email_comptable,
        factures.length,
        user.id,
        emailResult.success ? 'envoye' : 'erreur',
        emailResult.error
      );

      await saveEnvoiComptabilite(
        user.boucherie_id,
        'encaissements',
        selectedMois,
        selectedAnnee,
        boucherie.email_comptable,
        encaissements.length,
        user.id,
        emailResult.success ? 'envoye' : 'erreur',
        emailResult.error
      );

      if (emailResult.success) {
        setShowSuccessModal(true);
        // Recharger l'historique
        await loadEnvoisHistory();
        setShowPreview(false);
      } else {
        setErrorMessage(emailResult.error || 'Erreur inconnue lors de l\'envoi');
        setShowErrorModal(true);
      }

    } catch (error) {
      console.error('Erreur génération/envoi:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erreur lors de la génération ou de l\'envoi');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadExcel() {
    if (!boucherie) return;

    // Télécharger les factures
    if (factures.length > 0) {
      const facturesExcelBuffer = generateFacturesExcel(factures, boucherie.nom, selectedMois, selectedAnnee);
      const facturesFilename = generateExcelFilename(boucherie.nom, selectedMois, selectedAnnee, 'factures');
      downloadExcel(facturesExcelBuffer, facturesFilename);
    }

    // Télécharger les encaissements
    if (encaissements.length > 0) {
      const encaissementsExcelBuffer = generateEncaissementsExcel(encaissements, boucherie.nom, selectedMois, selectedAnnee);
      const encaissementsFilename = generateExcelFilename(boucherie.nom, selectedMois, selectedAnnee, 'encaissements');
      downloadExcel(encaissementsExcelBuffer, encaissementsFilename);
    }
  }

  return (
    <div className="comptabilite-page">
      <div className="page-header">
        <h1>📊 Envoi Comptabilité</h1>
        <div className="email-comptable-container">
          {!isEditingEmail ? (
            <div className="email-display">
              {boucherie?.email_comptable ? (
                <>
                  <span className="email-comptable">📧 {boucherie.email_comptable}</span>
                  <button
                    onClick={() => setIsEditingEmail(true)}
                    className="btn-edit-email"
                    title="Modifier l'email"
                  >
                    ✏️
                  </button>
                </>
              ) : (
                <>
                  <span className="email-comptable warning">⚠️ Aucun email comptable configuré</span>
                  <button
                    onClick={() => setIsEditingEmail(true)}
                    className="btn-edit-email"
                    title="Ajouter un email"
                  >
                    ✏️
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="email-edit">
              <input
                type="email"
                value={emailComptable}
                onChange={(e) => setEmailComptable(e.target.value)}
                placeholder="email@comptable.fr"
                className="email-input"
                autoFocus
              />
              <button
                onClick={handleSaveEmail}
                className="btn-save-email"
                title="Sauvegarder"
              >
                ✅
              </button>
              <button
                onClick={() => {
                  setIsEditingEmail(false);
                  setEmailComptable(boucherie?.email_comptable || '');
                }}
                className="btn-cancel-email"
                title="Annuler"
              >
                ❌
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="comptabilite-content">
        {/* Section Nouvel Envoi */}
        <section className="section-envoi">
          <h2>Nouvel envoi</h2>

          <div className="form-group">
            <label>Période</label>
            <div className="periode-selector">
              <select
                value={selectedMois}
                onChange={(e) => setSelectedMois(Number(e.target.value))}
                className="select-mois"
              >
                {moisNoms.map((nom, index) => (
                  <option key={index + 1} value={index + 1}>
                    {nom}
                  </option>
                ))}
              </select>

              <select
                value={selectedAnnee}
                onChange={(e) => setSelectedAnnee(Number(e.target.value))}
                className="select-annee"
              >
                {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="actions">
            <button
              onClick={loadFacturesPreview}
              disabled={loading}
              className="btn-preview"
            >
              {loading ? '⏳ Chargement...' : '👁️ Prévisualiser'}
            </button>
          </div>

          {/* Prévisualisation */}
          {showPreview && (
            <div className="preview-section">
              <h3>Aperçu des données</h3>

              {/* Récapitulatif des totaux */}
              <div className="totaux-recap">
                <div className="recap-card factures">
                  <div className="recap-icon">📄</div>
                  <div className="recap-content">
                    <div className="recap-label">Factures</div>
                    <div className="recap-count">{factures.length} facture(s)</div>
                    <div className="recap-montant">{factures.reduce((sum, f) => sum + f.montant, 0).toFixed(2)} €</div>
                    {(() => {
                      const facturesSansPJ = factures.filter(f => !f.piece_jointe).length;
                      if (facturesSansPJ > 0) {
                        return (
                          <div className="recap-warning">
                            ⚠️ {facturesSansPJ} facture(s) sans pièce jointe
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {(() => {
                    const totalFactures = factures.length;
                    if (totalFactures === 0) return null;

                    const facturesAvecPJ = factures.filter(f => f.piece_jointe).length;
                    const score = Math.round((facturesAvecPJ / totalFactures) * 100);

                    let scoreClass = 'score-red';
                    if (score >= 80) scoreClass = 'score-green';
                    else if (score >= 50) scoreClass = 'score-orange';

                    return (
                      <div className={`recap-score ${scoreClass}`}>
                        {score}%
                      </div>
                    );
                  })()}
                </div>

                <div className="recap-card encaissements">
                  <div className="recap-icon">💰</div>
                  <div className="recap-content">
                    <div className="recap-label">Encaissements</div>
                    <div className="recap-count">{encaissements.length} jour(s)</div>
                    <div className="recap-montant">{encaissements.reduce((sum, e) => sum + e.total, 0).toFixed(2)} €</div>
                    {(() => {
                      // Calculer les jours manquants
                      const startDate = new Date(selectedAnnee, selectedMois - 1, 1);
                      const endDate = new Date(selectedAnnee, selectedMois, 0);
                      const totalDaysInMonth = endDate.getDate();
                      const joursSansEncaissement = totalDaysInMonth - encaissements.length;

                      if (joursSansEncaissement > 0) {
                        return (
                          <div className="recap-warning">
                            ⚠️ {joursSansEncaissement} jour(s) sans encaissement
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {(() => {
                    const startDate = new Date(selectedAnnee, selectedMois - 1, 1);
                    const endDate = new Date(selectedAnnee, selectedMois, 0);
                    const totalDaysInMonth = endDate.getDate();

                    if (totalDaysInMonth === 0) return null;

                    const score = Math.round((encaissements.length / totalDaysInMonth) * 100);

                    let scoreClass = 'score-red';
                    if (score >= 80) scoreClass = 'score-green';
                    else if (score >= 50) scoreClass = 'score-orange';

                    return (
                      <div className={`recap-score ${scoreClass}`}>
                        {score}%
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Prévisualisation des Factures */}
              {factures.length > 0 && (
                <>
                  <h4 className="preview-subtitle">📄 Détail des factures</h4>

                  {/* Alerte factures sans pièce jointe */}
                  {(() => {
                    const facturesSansPJ = factures.filter(f => !f.piece_jointe);
                    if (facturesSansPJ.length > 0) {
                      return (
                        <div className="preview-alert warning">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          <div className="alert-content">
                            <strong>{facturesSansPJ.length} facture(s) sans pièce jointe</strong>
                            <div className="alert-dates">
                              {facturesSansPJ.map(f => format(new Date(f.date_facture), 'dd/MM/yyyy')).join(', ')}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="preview-cards-container">
                    {factures.slice(0, 5).map(facture => (
                      <div key={facture.id} className="preview-card">
                        <div className="preview-card-header">
                          <span className="preview-card-date">{format(new Date(facture.date_facture), 'dd/MM/yyyy')}</span>
                          <span className={`preview-card-badge ${facture.regle ? 'regle' : 'non-regle'}`}>
                            {facture.regle ? '✅ Réglé' : '⏳ En attente'}
                          </span>
                        </div>
                        <div className="preview-card-body">
                          <div className="preview-card-fournisseur">{facture.fournisseur}</div>
                          <div className="preview-card-montant">{facture.montant.toFixed(2)} €</div>
                        </div>
                      </div>
                    ))}
                    {factures.length > 5 && (
                      <div className="preview-more-card">
                        ... et {factures.length - 5} autre(s) facture(s)
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Prévisualisation des Encaissements */}
              {encaissements.length > 0 && (
                <>
                  <h4 className="preview-subtitle">💰 Détail des encaissements</h4>

                  {/* Alerte jours sans encaissement */}
                  {(() => {
                    // Calculer tous les jours du mois
                    const startDate = new Date(selectedAnnee, selectedMois - 1, 1);
                    const endDate = new Date(selectedAnnee, selectedMois, 0);
                    const totalDaysInMonth = endDate.getDate();

                    // Récupérer les jours avec encaissement
                    const joursAvecEncaissement = new Set(
                      encaissements.map(e => new Date(e.date).getDate())
                    );

                    // Trouver les jours sans encaissement
                    const joursSansEncaissement: number[] = [];
                    for (let jour = 1; jour <= totalDaysInMonth; jour++) {
                      if (!joursAvecEncaissement.has(jour)) {
                        joursSansEncaissement.push(jour);
                      }
                    }

                    if (joursSansEncaissement.length > 0) {
                      return (
                        <div className="preview-alert warning">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          <div className="alert-content">
                            <strong>{joursSansEncaissement.length} jour(s) sans encaissement</strong>
                            <div className="alert-dates">
                              {joursSansEncaissement.map(jour =>
                                format(new Date(selectedAnnee, selectedMois - 1, jour), 'dd/MM/yyyy')
                              ).join(', ')}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="preview-cards-container">
                    {encaissements.slice(0, 5).map(enc => (
                      <div key={enc.id} className="preview-card">
                        <div className="preview-card-header">
                          <span className="preview-card-date">{format(new Date(enc.date), 'dd/MM/yyyy')}</span>
                          <span className="preview-card-total">{enc.total.toFixed(2)} €</span>
                        </div>
                        <div className="preview-card-body">
                          <div className="preview-card-details">
                            <div className="detail-item">
                              <span className="detail-label">Espèce</span>
                              <span className="detail-value">{enc.espece.toFixed(2)} €</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">CB</span>
                              <span className="detail-value">{enc.cb.toFixed(2)} €</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">CH/VR</span>
                              <span className="detail-value">{enc.ch_vr.toFixed(2)} €</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">TR</span>
                              <span className="detail-value">{enc.tr.toFixed(2)} €</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {encaissements.length > 5 && (
                      <div className="preview-more-card">
                        ... et {encaissements.length - 5} autre(s) encaissement(s)
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Actions */}
              {(factures.length > 0 || encaissements.length > 0) && (
                <div className="preview-actions">
                  <button
                    onClick={handleDownloadExcel}
                    className="btn-action btn-download"
                  >
                    <span className="btn-icon">📊</span>
                    <span className="btn-text">Télécharger Excel</span>
                  </button>
                  <button
                    onClick={handleOpenConfirmModal}
                    disabled={loading || !boucherie?.email_comptable}
                    className="btn-action btn-send"
                  >
                    <span className="btn-icon">{loading ? '⏳' : '📧'}</span>
                    <span className="btn-text">{loading ? 'Envoi...' : 'Générer et envoyer'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <ConfirmModal
          isOpen={showConfirmModal}
          title="Confirmation d'envoi"
          message={`Envoyer ${factures.length} facture(s) et ${encaissements.length} encaissement(s) à ${boucherie?.email_comptable || ''} ?`}
          confirmText="OK"
          cancelText="Annuler"
          confirmVariant="primary"
          onConfirm={handleGenerateAndSend}
          onCancel={() => setShowConfirmModal(false)}
        />

        <ConfirmModal
          isOpen={showSuccessModal}
          title="Envoi réussi"
          message="Comptabilité envoyée avec succès !"
          confirmText="OK"
          confirmVariant="success"
          onConfirm={() => setShowSuccessModal(false)}
          onCancel={() => setShowSuccessModal(false)}
        />

        <ConfirmModal
          isOpen={showErrorModal}
          title="Erreur d'envoi"
          message={`Erreur lors de l'envoi: ${errorMessage}`}
          confirmText="OK"
          confirmVariant="danger"
          onConfirm={() => setShowErrorModal(false)}
          onCancel={() => setShowErrorModal(false)}
        />

        {/* Section Historique */}
        <section className="section-historique">
          <h2>Historique des envois</h2>

          {envoisHistory.length === 0 && (
            <p className="no-history">Aucun envoi effectué pour le moment</p>
          )}

          {envoisHistory.length > 0 && (
            <div className="envois-cards-container">
              {envoisHistory.map(envoi => (
                <div key={envoi.id} className={`envoi-card ${envoi.statut}`}>
                  <div className="envoi-card-header">
                    <div className="envoi-header-row">
                      <div className="envoi-date">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 6v6l4 2"/>
                        </svg>
                        {format(parseISO(envoi.date_envoi), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </div>
                      <div className={`envoi-status-badge ${envoi.statut}`}>
                        {envoi.statut === 'envoye' ? 'Envoyé' : 'Erreur'}
                      </div>
                    </div>
                  </div>

                  <div className="envoi-card-body">
                    <div className="envoi-details-grid">
                      <div className="envoi-detail-item">
                        <div className="envoi-detail-label">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          Période
                        </div>
                        <div className="envoi-detail-value">{moisNoms[envoi.mois - 1]} {envoi.annee}</div>
                      </div>

                      <div className="envoi-detail-item">
                        <div className="envoi-detail-label">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <path d="M22 6l-10 7L2 6"/>
                          </svg>
                          Email
                        </div>
                        <div className="envoi-detail-value">{envoi.email_destinataire}</div>
                      </div>

                      <div className="envoi-detail-item">
                        <div className="envoi-detail-label">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          Lignes
                        </div>
                        <div className="envoi-detail-value">{envoi.nombre_lignes}</div>
                      </div>

                      <div className="envoi-detail-item">
                        <div className="envoi-detail-label">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          Type
                        </div>
                        <div className="envoi-detail-value">{envoi.type_export}</div>
                      </div>
                    </div>

                    {envoi.erreur_message && (
                      <div className="envoi-error-message">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        {envoi.erreur_message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
