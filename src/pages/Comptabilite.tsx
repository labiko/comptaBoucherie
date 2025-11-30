import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Boucherie, Facture, EnvoiComptabilite } from '../types';
import { generateFacturesExcel, downloadExcel, generateExcelFilename } from '../lib/csv';
import { sendFacturesCsvEmail, saveEnvoiComptabilite, getEnvoisHistory } from '../lib/email';
import { format } from 'date-fns';
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

  // Sélection du mois/année
  const currentDate = new Date();
  const [selectedMois, setSelectedMois] = useState(currentDate.getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(currentDate.getFullYear());

  // Prévisualisation des données
  const [factures, setFactures] = useState<Facture[]>([]);
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
      setShowPreview(true);

    } catch (error) {
      console.error('Erreur chargement factures:', error);
      alert('Erreur lors du chargement des factures');
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
      // Générer le CSV
      const csvContent = generateFacturesCsv(factures);
      const filename = generateCsvFilename(boucherie.nom, selectedMois, selectedAnnee, 'factures');

      // Envoyer l'email (simulation pour l'instant)
      const emailResult = await sendFacturesCsvEmail(
        boucherie.email_comptable,
        csvContent,
        filename,
        selectedMois,
        selectedAnnee,
        boucherie.nom
      );

      // Enregistrer l'envoi dans la base
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

      if (emailResult.success) {
        alert('✅ Factures envoyées avec succès !\n\nNote: Pour l\'instant, l\'email est simulé. Le fichier CSV sera téléchargé localement.');

        // Télécharger le CSV localement pour tester
        downloadCsv(csvContent, filename);

        // Recharger l'historique
        await loadEnvoisHistory();
        setShowPreview(false);
      } else {
        alert('❌ Erreur lors de l\'envoi: ' + emailResult.error);
      }

    } catch (error) {
      console.error('Erreur génération/envoi:', error);
      alert('Erreur lors de la génération ou de l\'envoi');
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadExcel() {
    if (!boucherie || factures.length === 0) return;

    const excelBuffer = generateFacturesExcel(factures, boucherie.nom, selectedMois, selectedAnnee);
    const filename = generateExcelFilename(boucherie.nom, selectedMois, selectedAnnee, 'factures');

    downloadExcel(excelBuffer, filename);
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
              <p className="preview-info">
                {factures.length} facture(s) pour {moisNoms[selectedMois - 1]} {selectedAnnee}
              </p>

              {factures.length > 0 && (
                <>
                  <div className="preview-table-container">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Fournisseur</th>
                          <th>Montant</th>
                          <th>Réglé</th>
                        </tr>
                      </thead>
                      <tbody>
                        {factures.slice(0, 5).map(facture => (
                          <tr key={facture.id}>
                            <td>{format(new Date(facture.date_facture), 'dd/MM/yyyy')}</td>
                            <td>{facture.fournisseur}</td>
                            <td>{facture.montant.toFixed(2)} €</td>
                            <td>{facture.regle ? '✅' : '❌'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {factures.length > 5 && (
                      <p className="preview-more">... et {factures.length - 5} autre(s)</p>
                    )}
                  </div>

                  <div className="preview-actions">
                    <button
                      onClick={handleDownloadExcel}
                      className="btn-download btn-excel"
                    >
                      📊 Télécharger Excel
                    </button>
                    <button
                      onClick={handleOpenConfirmModal}
                      disabled={loading || !boucherie?.email_comptable}
                      className="btn-send"
                    >
                      {loading ? '⏳ Envoi...' : '📧 Générer et envoyer'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        <ConfirmModal
          isOpen={showConfirmModal}
          title="localhost:5174 indique"
          message={`Envoyer ${factures.length} facture(s) à ${boucherie?.email_comptable || ''} ?`}
          confirmText="OK"
          cancelText="Annuler"
          confirmVariant="primary"
          onConfirm={handleGenerateAndSend}
          onCancel={() => setShowConfirmModal(false)}
        />

        {/* Section Historique */}
        <section className="section-historique">
          <h2>Historique des envois</h2>

          {envoisHistory.length === 0 && (
            <p className="no-history">Aucun envoi effectué pour le moment</p>
          )}

          {envoisHistory.length > 0 && (
            <div className="historique-list">
              {envoisHistory.map(envoi => (
                <div key={envoi.id} className={`historique-item ${envoi.statut}`}>
                  <div className="historique-header">
                    <span className="historique-date">
                      {format(new Date(envoi.date_envoi), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </span>
                    <span className={`historique-statut ${envoi.statut}`}>
                      {envoi.statut === 'envoye' ? '✅ Envoyé' : '❌ Erreur'}
                    </span>
                  </div>
                  <div className="historique-details">
                    <div>📅 {moisNoms[envoi.mois - 1]} {envoi.annee}</div>
                    <div>📧 {envoi.email_destinataire}</div>
                    <div>📄 {envoi.nombre_lignes} ligne(s)</div>
                    <div>📦 {envoi.type_export}</div>
                  </div>
                  {envoi.erreur_message && (
                    <div className="historique-erreur">
                      ⚠️ {envoi.erreur_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
