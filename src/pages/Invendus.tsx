import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { CategorieInvendu, Invendu } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import './Invendus.css';

export default function Invendus() {
  const { user } = useAuth();
  const [invendus, setInvendus] = useState<Invendu[]>([]);
  const [categories, setCategories] = useState<CategorieInvendu[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [existingInvendu, setExistingInvendu] = useState<Invendu | null>(null);

  // Formulaire pour nouvel invendu
  const [newInvendu, setNewInvendu] = useState({
    date: new Date().toISOString().split('T')[0],
    categorie_id: '',
    produit: '',
    quantite: 0,
    valeur_estimee: 0,
    note: ''
  });

  // Charger les catégories et les invendus
  useEffect(() => {
    if (user) {
      loadCategories();
      loadInvendus();
    }
  }, [user]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories_invendus')
        .select('*')
        .eq('actif', true)
        .order('nom');

      if (error) throw error;

      setCategories(data || []);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const loadInvendus = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Charger les invendus du mois courant uniquement
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('invendus')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .gte('date', firstDay)
        .lte('date', lastDay)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvendus(data || []);
    } catch (error) {
      console.error('Erreur chargement invendus:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-calcul de la valeur estimée quand catégorie ou quantité change
  const handleCategorieChange = (categorieId: string) => {
    const categorie = categories.find(c => c.id === categorieId);
    const valeurEstimee = categorie ? categorie.prix_moyen * newInvendu.quantite : 0;

    setNewInvendu({
      ...newInvendu,
      categorie_id: categorieId,
      produit: categorie?.nom || '',
      valeur_estimee: valeurEstimee
    });
  };

  const handleQuantiteChange = (quantite: number) => {
    const categorie = categories.find(c => c.id === newInvendu.categorie_id);
    const valeurEstimee = categorie ? categorie.prix_moyen * quantite : newInvendu.valeur_estimee;

    setNewInvendu({
      ...newInvendu,
      quantite,
      valeur_estimee: valeurEstimee
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);

      // Vérifier si un invendu existe déjà pour cette date + catégorie
      const { data: existing, error: checkError } = await supabase
        .from('invendus')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .eq('date', newInvendu.date)
        .eq('categorie_id', newInvendu.categorie_id)
        .maybeSingle();

      if (checkError) throw checkError;

      // Si un invendu existe déjà, afficher le modal de choix
      if (existing) {
        setExistingInvendu(existing);
        setShowDuplicateModal(true);
        setSaving(false);
        return;
      }

      // Sinon, créer normalement
      const { error } = await supabase
        .from('invendus')
        .insert({
          boucherie_id: user.boucherie_id,
          date: newInvendu.date,
          categorie_id: newInvendu.categorie_id || null,
          produit: newInvendu.produit,
          quantite: newInvendu.quantite,
          valeur_estimee: newInvendu.valeur_estimee,
          note: newInvendu.note || null
        });

      if (error) throw error;

      // Réinitialiser le formulaire
      setNewInvendu({
        date: new Date().toISOString().split('T')[0],
        categorie_id: '',
        produit: '',
        quantite: 0,
        valeur_estimee: 0,
        note: ''
      });

      // Fermer le formulaire
      setShowForm(false);

      // Recharger les données
      await loadInvendus();
    } catch (error) {
      console.error('Erreur ajout invendu:', error);
      alert('Erreur lors de l\'ajout de l\'invendu');
    } finally {
      setSaving(false);
    }
  };

  // Action 1 : Remplacer l'existant
  const handleReplace = async () => {
    if (!existingInvendu) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('invendus')
        .update({
          produit: newInvendu.produit,
          quantite: newInvendu.quantite,
          valeur_estimee: newInvendu.valeur_estimee,
          note: newInvendu.note || null
        })
        .eq('id', existingInvendu.id);

      if (error) throw error;

      // Fermer le modal et réinitialiser
      setShowDuplicateModal(false);
      setExistingInvendu(null);
      setNewInvendu({
        date: new Date().toISOString().split('T')[0],
        categorie_id: '',
        produit: '',
        quantite: 0,
        valeur_estimee: 0,
        note: ''
      });
      setShowForm(false);

      await loadInvendus();
    } catch (error) {
      console.error('Erreur remplacement invendu:', error);
      alert('Erreur lors du remplacement');
    } finally {
      setSaving(false);
    }
  };

  // Action 2 : Annuler
  const handleCancel = () => {
    setShowDuplicateModal(false);
    setExistingInvendu(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet invendu ?')) return;

    try {
      const { error } = await supabase
        .from('invendus')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadInvendus();
    } catch (error) {
      console.error('Erreur suppression invendu:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const totalValeur = invendus.reduce((sum, inv) => sum + inv.valeur_estimee, 0);

  // Date max pour le formulaire (aujourd'hui)
  const maxDate = new Date().toISOString().split('T')[0];

  if (loading) {
    return <div className="page-invendus">Chargement...</div>;
  }

  return (
    <div className="page-invendus">
      <header className="page-header">
        <h1>Gestion des Invendus</h1>
        <button
          className="btn-add-invendu"
          onClick={() => setShowForm(!showForm)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {showForm ? (
              <path d="M18 6L6 18M6 6l12 12"/>
            ) : (
              <>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </>
            )}
          </svg>
          {showForm ? 'Annuler' : 'Créer un invendu'}
        </button>
      </header>

      {/* Formulaire d'ajout */}
      {showForm && (
        <section className="invendu-form-section">
          <h2>Ajouter un invendu</h2>
          <form onSubmit={handleSubmit} className="invendu-form">
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newInvendu.date}
                  onChange={(e) => setNewInvendu({ ...newInvendu, date: e.target.value })}
                  max={maxDate}
                  required
                />
              </div>
              <div className="form-group">
                <label>Catégorie</label>
                <select
                  value={newInvendu.categorie_id}
                  onChange={(e) => handleCategorieChange(e.target.value)}
                  required
                >
                  <option value="">Choisir une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nom} ({cat.prix_moyen.toFixed(2)} €)
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantité</label>
                <input
                  type="number"
                  step="0.01"
                  value={newInvendu.quantite}
                  onChange={(e) => handleQuantiteChange(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Valeur estimée (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newInvendu.valeur_estimee.toFixed(2)}
                  readOnly
                  className="readonly-field"
                  title="Calcul automatique : Prix moyen × Quantité"
                />
              </div>
              <div className="form-group">
                <label>Note (optionnel)</label>
                <textarea
                  value={newInvendu.note}
                  onChange={(e) => setNewInvendu({ ...newInvendu, note: e.target.value })}
                  placeholder="Remarques..."
                  rows={2}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Ajouter l\'invendu'}
            </button>
          </form>
        </section>
      )}

      {/* Liste des invendus */}
      <section className="invendus-list-section">
        <div className="section-header">
          <h2>Invendus du mois</h2>
          <div className="total-badge">
            Total: {totalValeur.toFixed(2)} €
          </div>
        </div>

        {invendus.length === 0 ? (
          <div className="empty-state">
            <p>Aucun invendu enregistré ce mois-ci</p>
          </div>
        ) : (
          <div className="invendus-table">
            {invendus.map((invendu) => (
              <div key={invendu.id} className="invendu-card">
                <div className="invendu-header">
                  <div className="invendu-date">
                    {new Date(invendu.date).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                  <button
                    onClick={() => handleDelete(invendu.id)}
                    className="btn-delete"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
                <div className="invendu-body">
                  <div className="invendu-produit">{invendu.produit}</div>
                  <div className="invendu-details">
                    <span className="detail-item">
                      Quantité: <strong>{invendu.quantite}</strong>
                    </span>
                    <span className="detail-item">
                      Valeur: <strong>{invendu.valeur_estimee.toFixed(2)} €</strong>
                    </span>
                  </div>
                  {invendu.note && (
                    <div className="invendu-note">
                      📝 {invendu.note}
                    </div>
                  )}
                </div>
                <div className="invendu-footer">
                  <div className="created-at">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                    Créé le {format(parseISO(invendu.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal de choix pour les doublons */}
      {showDuplicateModal && existingInvendu && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ Invendu déjà existant</h2>
            <p>
              Un invendu pour <strong>{newInvendu.produit}</strong> existe déjà pour le{' '}
              <strong>{new Date(newInvendu.date).toLocaleDateString('fr-FR')}</strong>.
            </p>

            <div className="existing-info">
              <h3>Invendu existant :</h3>
              <p>Quantité : <strong>{existingInvendu.quantite}</strong></p>
              <p>Valeur estimée : <strong>{existingInvendu.valeur_estimee.toFixed(2)} €</strong></p>
            </div>

            <div className="new-info">
              <h3>Nouvelle saisie :</h3>
              <p>Quantité : <strong>{newInvendu.quantite}</strong></p>
              <p>Valeur estimée : <strong>{newInvendu.valeur_estimee.toFixed(2)} €</strong></p>
            </div>

            <div className="modal-actions">
              <button
                className="btn-modal btn-replace"
                onClick={handleReplace}
                disabled={saving}
              >
                🔄 Remplacer
              </button>
              <button
                className="btn-modal btn-cancel"
                onClick={handleCancel}
                disabled={saving}
              >
                ❌ Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
