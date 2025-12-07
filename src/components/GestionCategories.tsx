import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNotification } from '../contexts/NotificationContext';
import { formatMontantAvecDevise } from '../lib/format';
import type { CategorieInvendu } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import './GestionCategories.css';

interface CategorieCardProps {
  categorie: CategorieInvendu;
  onEdit: (categorie: CategorieInvendu) => void;
}

function CategorieCard({ categorie, onEdit }: CategorieCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`categorie-card ${!categorie.actif ? 'inactive-card' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="card-header">
        <div className="card-header-row">
          <div className="card-nom-wrapper">
            <div className="card-nom">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16"/>
              </svg>
              {categorie.nom}
            </div>
            <span className={`status-badge ${categorie.actif ? 'active' : 'inactive'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {categorie.actif ? (
                  <polyline points="20 6 9 17 4 12"/>
                ) : (
                  <circle cx="12" cy="12" r="10"/>
                )}
              </svg>
              {categorie.actif ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <div className="card-prix-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            {formatMontantAvecDevise(categorie.prix_moyen)}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="card-details" onClick={(e) => e.stopPropagation()}>
          <div className="card-detail-row">
            <span className="detail-label">Prix moyen:</span>
            <span className="detail-value">{formatMontantAvecDevise(categorie.prix_moyen)}</span>
          </div>
          <div className="card-detail-row">
            <span className="detail-label">Statut:</span>
            <span className={`detail-value ${categorie.actif ? 'active' : 'inactive'}`}>
              {categorie.actif ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <div className="card-detail-row">
            <span className="detail-label">Créé le:</span>
            <span className="detail-value">
              {format(parseISO(categorie.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
            </span>
          </div>
          {categorie.updated_at && (
            <div className="card-detail-row">
              <span className="detail-label">Modifié le:</span>
              <span className="detail-value">
                {format(parseISO(categorie.updated_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
              </span>
            </div>
          )}
          <button
            className="card-edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(categorie);
            }}
          >
            ✏️ Modifier
          </button>
        </div>
      )}
    </div>
  );
}

export function GestionCategories() {
  const { showSuccess, showError } = useNotification();
  const [categories, setCategories] = useState<CategorieInvendu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    nom: '',
    prix_moyen: 0,
    actif: true
  });
  const [newCategorie, setNewCategorie] = useState({
    nom: '',
    prix_moyen: 0
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error} = await supabase
        .from('categories_invendus')
        .select('*')
        .order('nom');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      showError('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (categorie: CategorieInvendu) => {
    setEditingId(categorie.id);
    setEditForm({
      nom: categorie.nom,
      prix_moyen: categorie.prix_moyen,
      actif: categorie.actif
    });
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ nom: '', prix_moyen: 0, actif: true });
    setShowAddForm(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('categories_invendus')
        .update({
          nom: editForm.nom,
          prix_moyen: editForm.prix_moyen,
          actif: editForm.actif,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;

      showSuccess('Catégorie mise à jour avec succès');
      await loadCategories();
      setEditingId(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Erreur mise à jour catégorie:', error);
      showError('Erreur lors de la mise à jour de la catégorie');
    }
  };

  const handleAdd = async () => {
    if (!newCategorie.nom.trim()) {
      showError('Le nom de la catégorie est requis');
      return;
    }

    try {
      const { error } = await supabase
        .from('categories_invendus')
        .insert({
          nom: newCategorie.nom.trim(),
          prix_moyen: newCategorie.prix_moyen,
          actif: true
        });

      if (error) throw error;

      showSuccess('Catégorie ajoutée avec succès');
      await loadCategories();
      setNewCategorie({ nom: '', prix_moyen: 0 });
      setShowAddForm(false);
    } catch (error) {
      console.error('Erreur ajout catégorie:', error);
      showError('Erreur lors de l\'ajout de la catégorie');
    }
  };

  const handleSubmit = async () => {
    if (editingId) {
      await handleSaveEdit();
    } else {
      await handleAdd();
    }
  };

  if (loading) {
    return <div className="page-categories loading">Chargement...</div>;
  }

  return (
    <div className="page-categories">
      <div className="page-header">
        <h1>Catégories d'Invendus</h1>
        <button
          className="btn-add-categorie"
          onClick={() => {
            if (showAddForm) {
              handleCancelEdit();
            } else {
              setShowAddForm(true);
            }
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {showAddForm ? (
              <path d="M18 6L6 18M6 6l12 12"/>
            ) : (
              <>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </>
            )}
          </svg>
          {showAddForm ? 'Annuler' : 'Nouvelle catégorie'}
        </button>
      </div>

      {showAddForm && (
        <div className="form-section">
          <h2>{editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Nom de la catégorie</label>
              <input
                type="text"
                value={editingId ? editForm.nom : newCategorie.nom}
                onChange={(e) => editingId
                  ? setEditForm({ ...editForm, nom: e.target.value })
                  : setNewCategorie({ ...newCategorie, nom: e.target.value })
                }
                placeholder="Ex: Tartes, Viennoiseries, Pain..."
              />
            </div>
            <div className="form-group">
              <label>Prix moyen (€)</label>
              <input
                type="number"
                step="0.01"
                value={editingId ? editForm.prix_moyen : newCategorie.prix_moyen}
                onChange={(e) => editingId
                  ? setEditForm({ ...editForm, prix_moyen: parseFloat(e.target.value) || 0 })
                  : setNewCategorie({ ...newCategorie, prix_moyen: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            {editingId && (
              <div className="form-group">
                <label>Statut</label>
                <select
                  value={editForm.actif ? 'actif' : 'inactif'}
                  onChange={(e) => setEditForm({ ...editForm, actif: e.target.value === 'actif' })}
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>
            )}
          </div>
          <div className="form-actions">
            <button className="btn-submit" onClick={handleSubmit}>
              {editingId ? '✓ Mettre à jour' : '+ Ajouter'}
            </button>
            <button className="btn-cancel-form" onClick={handleCancelEdit}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="empty-state">
          <p>Aucune catégorie d'invendu. Créez-en une pour commencer.</p>
        </div>
      ) : (
        <div className="categories-list">
          {categories.map((categorie) => (
            <CategorieCard
              key={categorie.id}
              categorie={categorie}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
