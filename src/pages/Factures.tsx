import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatMontantAvecDevise } from '../lib/format';
import { uploadFactureImage, validateImageFile } from '../lib/storage';
import type { Facture } from '../types';
import { format, startOfMonth, endOfMonth, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Switch } from '../components/Switch';
import './Factures.css';

interface FactureCardProps {
  facture: Facture;
  onEdit: (facture: Facture) => void;
  isHighlighted: boolean;
  isToday: boolean;
}

function FactureCard({ facture, onEdit, isHighlighted, isToday }: FactureCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`facture-card ${isToday ? 'today-card' : ''} ${facture.solde_restant > 0 ? 'unpaid-card' : ''} ${isHighlighted ? 'highlighted-card' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="card-header">
        <div className="card-header-row">
          <div className="card-fournisseur-wrapper">
            <div className="card-fournisseur">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              {facture.fournisseur}
            </div>
            {isToday && <span className="today-badge">Aujourd'hui</span>}
            <div className="card-description">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              {facture.description}
            </div>
          </div>
          <div className="card-date-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {format(parseISO(facture.date_facture), 'dd/MM')}
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="card-amounts">
          <div className="amount-box">
            <div className="amount-label">
              Montant total
            </div>
            <div className="amount-value">{formatMontantAvecDevise(facture.montant)}</div>
          </div>
          <div className="amount-box">
            <div className="amount-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              Solde restant
            </div>
            <div className={`amount-value ${facture.solde_restant > 0 ? 'unpaid' : 'paid'}`}>
              {formatMontantAvecDevise(facture.solde_restant)}
            </div>
          </div>
        </div>

        <div className="card-meta">
          <span className={`meta-badge status-badge ${facture.regle ? 'paid' : 'unpaid'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {facture.regle ? (
                <polyline points="20 6 9 17 4 12"/>
              ) : (
                <circle cx="12" cy="12" r="10"/>
              )}
            </svg>
            {facture.regle ? 'Réglé' : 'Non réglé'}
          </span>
          <span className="meta-badge payment-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            {facture.mode_reglement}
          </span>
          {facture.piece_jointe && (
            <a
              href={facture.piece_jointe}
              target="_blank"
              rel="noopener noreferrer"
              className="meta-badge attachment-badge"
              onClick={(e) => e.stopPropagation()}
              title={facture.piece_jointe_updated_at ? `Ajoutée le ${format(parseISO(facture.piece_jointe_updated_at), 'dd/MM/yyyy HH:mm', { locale: fr })}` : 'Voir la pièce jointe'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              Pièce jointe
            </a>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="card-details" onClick={(e) => e.stopPropagation()}>
          <div className="card-detail-row">
            <span className="detail-label">Montant total:</span>
            <span className="detail-value">{formatMontantAvecDevise(facture.montant)}</span>
          </div>
          <div className="card-detail-row">
            <span className="detail-label">Solde restant:</span>
            <span className={`detail-value ${facture.solde_restant > 0 ? 'unpaid' : 'paid'}`}>
              {formatMontantAvecDevise(facture.solde_restant)}
            </span>
          </div>
          <div className="card-detail-row">
            <span className="detail-label">Échéance:</span>
            <span className="detail-value">{format(parseISO(facture.echeance), 'dd/MM')}</span>
          </div>
          <div className="card-detail-row">
            <span className="detail-label">Réglé:</span>
            <span className={`detail-value ${facture.regle ? 'paid' : 'unpaid'}`}>
              {facture.regle ? 'Oui' : 'Non'}
            </span>
          </div>
          <div className="card-detail-row">
            <span className="detail-label">Mode règlement:</span>
            <span className="detail-value">{facture.mode_reglement}</span>
          </div>
          {facture.piece_jointe && (
            <div className="card-detail-row">
              <span className="detail-label">Pièce jointe:</span>
              <a
                href={facture.piece_jointe}
                target="_blank"
                rel="noopener noreferrer"
                className="detail-link"
                onClick={(e) => e.stopPropagation()}
              >
                📎 Voir
              </a>
            </div>
          )}
          <button
            className="card-edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(facture);
            }}
          >
            ✏️ Modifier
          </button>
        </div>
      )}

      <div className="card-footer">
        <div className="created-at">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          Créé le {format(parseISO(facture.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
        </div>
      </div>
    </div>
  );
}

export function Factures() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Array<{ id: string; nom: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [formData, setFormData] = useState({
    date_facture: format(new Date(), 'yyyy-MM-dd'),
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
      loadFournisseurs();
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
        .order('date_facture', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('📊 loadFactures - Données chargées:', data?.length, 'factures');
      if (data && data.length > 0) {
        console.log('📊 Première facture - piece_jointe:', data[0].piece_jointe);
      }
      setFactures(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFournisseurs() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('fournisseurs')
        .select('id, nom')
        .eq('boucherie_id', user.boucherie_id)
        .eq('actif', true)
        .order('nom');

      if (error) throw error;
      setFournisseurs(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    console.log('📸 handleImageChange appelé, fichier:', file);

    if (!file) {
      setSelectedImage(null);
      setImagePreview(null);
      console.log('⚠️ Aucun fichier sélectionné');
      return;
    }

    // Validation
    const validation = validateImageFile(file);
    console.log('✅ Validation:', validation);

    if (!validation.valid) {
      showError(validation.error || 'Fichier invalide');
      e.target.value = '';
      console.error('❌ Fichier invalide:', validation.error);
      return;
    }

    setSelectedImage(file);
    console.log('💾 selectedImage mis à jour avec:', file.name, file.size);

    // Créer un aperçu
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      console.log('🖼️ Aperçu créé');
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || isSubmitting) return;

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

    // Déterminer la date à utiliser
    const date_facture = useCustomDate ? formData.date_facture : format(new Date(), 'yyyy-MM-dd');
    const echeance = format(addMonths(parseISO(date_facture), 1), 'yyyy-MM-dd');

    setIsSubmitting(true);

    try {
      if (editingId) {
        // Mode édition
        const updateData: any = {
          date_facture,
          echeance,
          fournisseur: formData.fournisseur,
          description: formData.description,
          montant,
          solde_restant,
          regle: formData.regle,
          mode_reglement: formData.mode_reglement,
          updated_by: user.id,
        };

        // Upload de l'image si une nouvelle a été sélectionnée
        console.log('🔍 Mode édition - selectedImage:', selectedImage);
        console.log('🔍 Mode édition - editingId:', editingId);

        if (selectedImage) {
          console.log('📤 Upload de l\'image en cours...');
          const uploadResult = await uploadFactureImage(selectedImage, user.boucherie_id, editingId);
          console.log('📤 Résultat upload:', uploadResult);

          if (uploadResult.success && uploadResult.url) {
            updateData.piece_jointe = uploadResult.url;
            updateData.piece_jointe_updated_at = new Date().toISOString();
            console.log('✅ Image mise à jour:', uploadResult.url);
          } else {
            console.error('❌ Erreur upload:', uploadResult.error);
            showError(uploadResult.error || 'Erreur lors de l\'upload de l\'image');
            return;
          }
        } else {
          console.log('⚠️ Aucune nouvelle image sélectionnée');
        }

        console.log('💾 Données à mettre à jour:', updateData);

        const { error, data: updatedData } = await supabase
          .from('factures')
          .update(updateData)
          .eq('id', editingId)
          .select();

        console.log('💾 Résultat de la mise à jour:', { error, updatedData });

        if (error) throw error;
      } else {
        // Mode création - Créer directement la facture (plusieurs factures par jour autorisées)
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
        date_facture: format(new Date(), 'yyyy-MM-dd'),
        fournisseur: '',
        description: '',
        montant: '',
        solde_restant: '',
        regle: false,
        mode_reglement: 'Virement',
      });
      setSelectedImage(null);
      setImagePreview(null);
      setShowForm(false);
      setEditingId(null);
      setUseCustomDate(false);

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
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(facture: Facture) {
    console.log('🔧 handleEdit appelé pour facture:', facture.id);
    console.log('🖼️ URL de l\'image dans facture:', facture.piece_jointe);
    console.log('📅 piece_jointe_updated_at:', facture.piece_jointe_updated_at);

    setEditingId(facture.id);
    setShowForm(true);

    // Activer le toggle si la date de la facture ≠ aujourd'hui
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isNotToday = facture.date_facture !== todayStr;
    setUseCustomDate(isNotToday);

    setFormData({
      date_facture: facture.date_facture,
      fournisseur: facture.fournisseur,
      description: facture.description,
      montant: facture.montant.toString(),
      solde_restant: facture.solde_restant.toString(),
      regle: facture.regle,
      mode_reglement: facture.mode_reglement,
    });

    // Charger l'image existante si présente
    if (facture.piece_jointe) {
      // Ajouter un cache-buster basé sur piece_jointe_updated_at pour forcer le rechargement
      let imageUrl = facture.piece_jointe;
      if (facture.piece_jointe_updated_at) {
        const timestamp = new Date(facture.piece_jointe_updated_at).getTime();
        imageUrl = `${facture.piece_jointe}?t=${timestamp}`;
        console.log('🔄 Cache-buster ajouté:', timestamp);
      }
      setImagePreview(imageUrl);
      setSelectedImage(null); // Pas de nouveau fichier sélectionné
      console.log('✅ imagePreview chargé avec:', imageUrl);
    } else {
      setImagePreview(null);
      setSelectedImage(null);
      console.log('⚠️ Aucune image à charger');
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
    setShowForm(false);
    setUseCustomDate(false);
    setFormData({
      date_facture: format(new Date(), 'yyyy-MM-dd'),
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

      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn-add-facture"
        >
          ➕ Nouvelle facture
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="facture-form">
          <div className="form-header">
            <h2 className="form-title">
              {editingFacture ? 'Modifier la facture' : 'Nouvelle facture'}
            </h2>
            <div className="form-header-actions">
              {editingFacture && (
                <button type="button" onClick={handleCancelEdit} className="btn-cancel">
                  Annuler
                </button>
              )}
              {!editingFacture && (
                <button type="button" onClick={() => setShowForm(false)} className="btn-close-form" title="Masquer le formulaire">
                  ✕
                </button>
              )}
            </div>
          </div>

          <Switch
            checked={useCustomDate}
            onChange={setUseCustomDate}
            label="Choisir une autre date"
          />

          {useCustomDate && (
            <div className="form-field">
              <label htmlFor="date_facture">Date de facture *</label>
              <input
                type="date"
                id="date_facture"
                value={formData.date_facture}
                max={format(today, 'yyyy-MM-dd')}
                onChange={(e) => handleInputChange('date_facture', e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="fournisseur">Fournisseur *</label>
              <select
                id="fournisseur"
                value={formData.fournisseur}
                onChange={(e) => handleInputChange('fournisseur', e.target.value)}
                required
              >
                <option value="">Sélectionnez un fournisseur</option>
                {fournisseurs.map((f) => (
                  <option key={f.id} value={f.nom}>
                    {f.nom}
                  </option>
                ))}
              </select>
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
              <div className="image-input-group">
                <input
                  type="file"
                  id="piece_jointe"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="file-input"
                  style={{ display: 'none' }}
                />
                <input
                  type="file"
                  id="piece_jointe_camera"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={handleImageChange}
                  className="file-input"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('piece_jointe')?.click()}
                  className="btn-secondary"
                >
                  📁 Choisir un fichier
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById('piece_jointe_camera')?.click()}
                  className="btn-secondary"
                >
                  📷 Prendre une photo
                </button>
              </div>
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

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : (editingFacture ? 'Enregistrer les modifications' : 'Enregistrer')}
          </button>
        </form>
      )}

      <div className="historique-section">
        <h3 className="section-title">Factures du mois</h3>

        {factures.length === 0 ? (
          <div className="empty-state">Aucune facture ce mois-ci</div>
        ) : (
          <>
            {/* Vue cartes */}
            <div className="factures-cards">
              {factures.map((facture) => {
                const todayStr = format(today, 'yyyy-MM-dd');
                const isToday = facture.date_facture === todayStr;

                return (
                  <FactureCard
                    key={facture.id}
                    facture={facture}
                    onEdit={handleEdit}
                    isHighlighted={highlightedId === facture.id}
                    isToday={isToday}
                  />
                );
              })}
            </div>

            {/* Vue tableau (masquée, conservée pour référence future) */}
            <div className="table-container" style={{ display: 'none' }}>
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
                      <td className="montant-cell">{formatMontantAvecDevise(facture.montant)}</td>
                      <td className={`solde-cell ${facture.solde_restant > 0 ? 'unpaid' : 'paid'}`}>
                        {formatMontantAvecDevise(facture.solde_restant)}
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
          </>
        )}
      </div>
    </div>
  );
}
