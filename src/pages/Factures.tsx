import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatMontantAvecDevise, formatMontant } from '../lib/format';
import { uploadFactureImage, deleteFactureImage, validateImageFile } from '../lib/storage';
import type { Facture } from '../types';
import { format, startOfMonth, endOfMonth, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import './Factures.css';

export function Factures() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fournisseur: '',
    description: '',
    montant: '',
    solde_restant: '',
    regle: false,
    mode_reglement: 'Virement',
  });

  const today = new Date();

  useEffect(() => {
    if (user) {
      loadFactures();
    }
  }, [user, selectedMonth]);

  async function loadFactures() {
    if (!user) return;

    try {
      setLoading(true);
      const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('factures')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .gte('date_facture', monthStart)
        .lte('date_facture', monthEnd)
        .order('date_facture', { ascending: false });

      if (error) throw error;
      setFactures(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedImage(null);
      setImagePreview(null);
      return;
    }

    // Validation
    const validation = validateImageFile(file);
    if (!validation.valid) {
      showError(validation.error || 'Fichier invalide');
      e.target.value = '';
      return;
    }

    setSelectedImage(file);

    // Créer un aperçu
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!formData.fournisseur || !formData.description || !formData.montant || !formData.solde_restant) {
      showError('Tous les champs sont obligatoires');
      return;
    }

    const montant = parseFloat(formData.montant);
    const solde_restant = parseFloat(formData.solde_restant);

    if (isNaN(montant) || isNaN(solde_restant)) {
      showError('Veuillez saisir des montants valides');
      return;
    }

    if (montant < 0 || solde_restant < 0) {
      showError('Les montants ne peuvent pas être négatifs');
      return;
    }

    if (solde_restant > montant) {
      showError('Le solde restant ne peut pas être supérieur au montant total');
      return;
    }

    // Calculer automatiquement date_facture et echeance
    const date_facture = format(new Date(), 'yyyy-MM-dd');
    const echeance = format(addMonths(new Date(), 1), 'yyyy-MM-dd');

    try {
      if (editingId) {
        // Mode édition
        const updateData: any = {
          fournisseur: formData.fournisseur,
          description: formData.description,
          montant,
          solde_restant,
          regle: formData.regle,
          mode_reglement: formData.mode_reglement,
          updated_by: user.id,
        };

        // Upload de l'image si une nouvelle a été sélectionnée
        if (selectedImage) {
          const uploadResult = await uploadFactureImage(selectedImage, user.boucherie_id, editingId);
          if (uploadResult.success && uploadResult.url) {
            updateData.piece_jointe = uploadResult.url;
            updateData.piece_jointe_updated_at = new Date().toISOString();
          } else {
            showError(uploadResult.error || 'Erreur lors de l\'upload de l\'image');
            return;
          }
        }

        const { error } = await supabase
          .from('factures')
          .update(updateData)
          .eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        // Mode création
        const { data: existingFactures, error: checkError } = await supabase
          .from('factures')
          .select('id')
          .eq('boucherie_id', user.boucherie_id)
          .eq('date_facture', date_facture);

        if (checkError) throw checkError;

        if (existingFactures && existingFactures.length > 0) {
          showError('Une facture existe déjà pour aujourd\'hui');
          return;
        }

        // Créer d'abord la facture pour obtenir l'ID
        const { data: newFacture, error: insertError } = await supabase
          .from('factures')
          .insert({
            boucherie_id: user.boucherie_id,
            date_facture,
            fournisseur: formData.fournisseur,
            echeance,
            description: formData.description,
            montant,
            solde_restant,
            regle: formData.regle,
            mode_reglement: formData.mode_reglement,
            user_id: user.id,
            updated_by: user.id,
          })
          .select()
          .single();

        if (insertError || !newFacture) throw insertError;

        // Upload de l'image si sélectionnée
        if (selectedImage) {
          const uploadResult = await uploadFactureImage(selectedImage, user.boucherie_id, newFacture.id);
          if (uploadResult.success && uploadResult.url) {
            await supabase
              .from('factures')
              .update({
                piece_jointe: uploadResult.url,
                piece_jointe_updated_at: new Date().toISOString(),
              })
              .eq('id', newFacture.id);
          }
        }
      }

      const savedEditingId = editingId;
      await loadFactures();
      showSuccess('Facture enregistrée !');

      // Réinitialiser le formulaire
      setFormData({
        fournisseur: '',
        description: '',
        montant: '',
        solde_restant: '',
        regle: false,
        mode_reglement: 'Virement',
      });
      setSelectedImage(null);
      setImagePreview(null);

      if (savedEditingId) {
        setHighlightedId(savedEditingId);
        setTimeout(() => {
          const rowElement = document.querySelector(`[data-facture-id="${savedEditingId}"]`);
          if (rowElement) {
            rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);

        setTimeout(() => {
          setHighlightedId(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showError('Erreur lors de la sauvegarde');
    }
  }

  function handleEdit(facture: Facture) {
    setEditingId(facture.id);
    setFormData({
      fournisseur: facture.fournisseur,
      description: facture.description,
      montant: facture.montant.toString(),
      solde_restant: facture.solde_restant.toString(),
      regle: facture.regle,
      mode_reglement: facture.mode_reglement,
    });

    // Charger l'image existante si présente
    if (facture.piece_jointe) {
      setImagePreview(facture.piece_jointe);
      setSelectedImage(null); // Pas de nouveau fichier sélectionné
    } else {
      setImagePreview(null);
      setSelectedImage(null);
    }

    setTimeout(() => {
      const formElement = document.querySelector('.facture-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setFormData({
      fournisseur: '',
      description: '',
      montant: '',
      solde_restant: '',
      regle: false,
      mode_reglement: 'Virement',
    });
    setSelectedImage(null);
    setImagePreview(null);
  }

  function handleInputChange(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  const totalMois = factures.reduce((sum, f) => sum + f.montant, 0);
  const totalSolde = factures.reduce((sum, f) => sum + f.solde_restant, 0);

  const editingFacture = editingId ? factures.find(f => f.id === editingId) : null;

  if (loading) {
    return (
      <div className="factures-container">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  const handleTodayMonth = () => {
    setSelectedMonth(new Date());
  };

  return (
    <div className="factures-container">
      <div className="date-badge">
        <div className="date-navigation">
          <button
            type="button"
            onClick={handlePreviousMonth}
            className="month-nav-btn"
            title="Mois précédent"
          >
            ←
          </button>
          <span className="date-text">
            {editingFacture
              ? `Édition de la facture du ${format(parseISO(editingFacture.date_facture), 'dd/MM/yyyy', { locale: fr })}`
              : format(selectedMonth, 'MMMM yyyy', { locale: fr })}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="month-nav-btn"
            title="Mois suivant"
          >
            →
          </button>
          {format(selectedMonth, 'yyyy-MM') !== format(today, 'yyyy-MM') && (
            <button
              type="button"
              onClick={handleTodayMonth}
              className="today-btn"
              title="Mois actuel"
            >
              Aujourd'hui
            </button>
          )}
        </div>
        <div className="totals-row">
          <span className="month-total">Total : {formatMontantAvecDevise(totalMois)}</span>
          <span className="solde-total">Solde : {formatMontantAvecDevise(totalSolde)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="facture-form">
        <div className="form-header">
          <h2 className="form-title">
            {editingFacture ? 'Modifier la facture' : 'Nouvelle facture'}
          </h2>
          {editingFacture && (
            <button type="button" onClick={handleCancelEdit} className="btn-cancel">
              Annuler
            </button>
          )}
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="fournisseur">Fournisseur *</label>
            <input
              type="text"
              id="fournisseur"
              value={formData.fournisseur}
              onChange={(e) => handleInputChange('fournisseur', e.target.value)}
              placeholder="Metro, Rungis..."
              required
            />
          </div>

          <div className="form-field full-width">
            <label htmlFor="description">Description *</label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Viande de bœuf..."
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="montant">Montant (€) *</label>
            <input
              type="number"
              id="montant"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={formData.montant}
              onChange={(e) => handleInputChange('montant', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="solde_restant">Solde restant (€) *</label>
            <input
              type="number"
              id="solde_restant"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={formData.solde_restant}
              onChange={(e) => handleInputChange('solde_restant', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="regle">Réglé *</label>
            <select
              id="regle"
              value={formData.regle ? 'true' : 'false'}
              onChange={(e) => setFormData(prev => ({ ...prev, regle: e.target.value === 'true' }))}
              required
            >
              <option value="false">Non</option>
              <option value="true">Oui</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="mode_reglement">Mode règlement *</label>
            <select
              id="mode_reglement"
              value={formData.mode_reglement}
              onChange={(e) => handleInputChange('mode_reglement', e.target.value)}
              required
            >
              <option value="Espèce">Espèce</option>
              <option value="Chèque">Chèque</option>
              <option value="Virement">Virement</option>
              <option value="Prélèvement">Prélèvement</option>
            </select>
          </div>

          <div className="form-field full-width">
            <label htmlFor="piece_jointe">Pièce jointe (image)</label>
            <input
              type="file"
              id="piece_jointe"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="file-input"
            />
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Aperçu" />
                {editingFacture && editingFacture.piece_jointe && !selectedImage && (
                  <div className="image-actions">
                    <a
                      href={editingFacture.piece_jointe}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-download"
                    >
                      📥 Télécharger
                    </a>
                    {editingFacture.piece_jointe_updated_at && (
                      <span className="image-info">
                        Ajoutée le {format(parseISO(editingFacture.piece_jointe_updated_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="btn-primary">
          {editingFacture ? 'Enregistrer les modifications' : 'Enregistrer'}
        </button>
      </form>

      <div className="historique-section">
        <h3 className="section-title">Factures du mois</h3>

        {factures.length === 0 ? (
          <div className="empty-state">Aucune facture ce mois-ci</div>
        ) : (
          <div className="table-container">
            <table className="factures-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Fournisseur</th>
                  <th>Description</th>
                  <th>Échéance</th>
                  <th>Montant</th>
                  <th>Solde</th>
                  <th>Réglé</th>
                  <th>Mode</th>
                  <th>PJ</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {factures.map((facture) => (
                  <tr
                    key={facture.id}
                    data-facture-id={facture.id}
                    className={`${facture.solde_restant > 0 ? 'unpaid-row' : ''} ${highlightedId === facture.id ? 'highlighted-row' : ''} clickable-row`}
                    onClick={() => handleEdit(facture)}
                  >
                    <td className="date-cell">
                      {format(parseISO(facture.date_facture), 'dd/MM')}
                    </td>
                    <td className="fournisseur-cell">{facture.fournisseur}</td>
                    <td className="description-cell">{facture.description}</td>
                    <td className="echeance-cell">
                      {format(parseISO(facture.echeance), 'dd/MM')}
                    </td>
                    <td className="montant-cell">{formatMontant(facture.montant)}</td>
                    <td className={`solde-cell ${facture.solde_restant > 0 ? 'unpaid' : 'paid'}`}>
                      {formatMontant(facture.solde_restant)}
                    </td>
                    <td className={`regle-cell ${facture.regle ? 'paid' : 'unpaid'}`}>
                      {facture.regle ? 'Oui' : 'Non'}
                    </td>
                    <td>{facture.mode_reglement}</td>
                    <td className="pj-cell">
                      {facture.piece_jointe && (
                        <a
                          href={facture.piece_jointe}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pj-link"
                          onClick={(e) => e.stopPropagation()}
                          title={facture.piece_jointe_updated_at ? `Ajoutée le ${format(parseISO(facture.piece_jointe_updated_at), 'dd/MM/yyyy HH:mm', { locale: fr })}` : 'Voir la pièce jointe'}
                        >
                          📎
                        </a>
                      )}
                    </td>
                    <td className="action-cell">
                      <svg
                        className="edit-icon"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
