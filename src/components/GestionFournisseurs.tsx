import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Fournisseur } from '../types';
import { ConfirmModal } from './ConfirmModal';
import './GestionFournisseurs.css';

export function GestionFournisseurs() {
  const { user } = useAuth();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);

  // Formulaire
  const [formData, setFormData] = useState({
    nom: '',
    type: '',
    telephone: '',
    email: '',
    adresse: '',
    actif: true
  });

  useEffect(() => {
    loadFournisseurs();
  }, [user]);

  async function loadFournisseurs() {
    if (!user?.boucherie_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fournisseurs')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .order('nom');

      if (error) throw error;
      setFournisseurs((data as Fournisseur[]) || []);
    } catch (error) {
      console.error('Erreur chargement fournisseurs:', error);
      alert('Erreur lors du chargement des fournisseurs');
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    setFormData({
      nom: '',
      type: '',
      telephone: '',
      email: '',
      adresse: '',
      actif: true
    });
    setShowAddModal(true);
  }

  function handleEdit(fournisseur: Fournisseur) {
    setSelectedFournisseur(fournisseur);
    setFormData({
      nom: fournisseur.nom,
      type: fournisseur.type || '',
      telephone: fournisseur.telephone || '',
      email: fournisseur.email || '',
      adresse: fournisseur.adresse || '',
      actif: fournisseur.actif
    });
    setShowEditModal(true);
  }

  function handleDeleteClick(fournisseur: Fournisseur) {
    setSelectedFournisseur(fournisseur);
    setShowDeleteModal(true);
  }

  async function handleSubmitAdd() {
    if (!user?.boucherie_id || !formData.nom.trim()) {
      alert('Le nom du fournisseur est obligatoire');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('fournisseurs')
        .insert({
          boucherie_id: user.boucherie_id,
          nom: formData.nom.trim(),
          type: formData.type.trim() || null,
          telephone: formData.telephone.trim() || null,
          email: formData.email.trim() || null,
          adresse: formData.adresse.trim() || null,
          actif: formData.actif
        });

      if (error) throw error;

      setShowAddModal(false);
      await loadFournisseurs();
    } catch (error) {
      console.error('Erreur ajout fournisseur:', error);
      alert('Erreur lors de l\'ajout du fournisseur');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitEdit() {
    if (!selectedFournisseur || !formData.nom.trim()) {
      alert('Le nom du fournisseur est obligatoire');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('fournisseurs')
        .update({
          nom: formData.nom.trim(),
          type: formData.type.trim() || null,
          telephone: formData.telephone.trim() || null,
          email: formData.email.trim() || null,
          adresse: formData.adresse.trim() || null,
          actif: formData.actif
        })
        .eq('id', selectedFournisseur.id);

      if (error) throw error;

      setShowEditModal(false);
      await loadFournisseurs();
    } catch (error) {
      console.error('Erreur modification fournisseur:', error);
      alert('Erreur lors de la modification du fournisseur');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!selectedFournisseur) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('fournisseurs')
        .delete()
        .eq('id', selectedFournisseur.id);

      if (error) throw error;

      setShowDeleteModal(false);
      setSelectedFournisseur(null);
      await loadFournisseurs();
    } catch (error) {
      console.error('Erreur suppression fournisseur:', error);
      alert('Erreur lors de la suppression du fournisseur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="gestion-fournisseurs">
      <div className="header-section">
        <h2>Gestion des Fournisseurs</h2>
        <button onClick={handleAdd} className="btn-add-fournisseur">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Ajouter un fournisseur
        </button>
      </div>

      {loading && <p className="loading">Chargement...</p>}

      {!loading && fournisseurs.length === 0 && (
        <div className="empty-state">
          <p>Aucun fournisseur enregistré</p>
        </div>
      )}

      {!loading && fournisseurs.length > 0 && (
        <div className="fournisseurs-cards">
          {fournisseurs.map(fournisseur => (
            <div key={fournisseur.id} className={`fournisseur-card ${!fournisseur.actif ? 'inactive' : ''}`}>
              <div className="card-header-row">
                <h3 className="fournisseur-nom">{fournisseur.nom}</h3>
                {!fournisseur.actif && <span className="badge-inactive">Inactif</span>}
              </div>

              {fournisseur.type && (
                <div className="fournisseur-detail">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 7V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V7" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{fournisseur.type}</span>
                </div>
              )}

              {fournisseur.telephone && (
                <div className="fournisseur-detail">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 16.92V19.92C22 20.52 21.5 21.02 20.9 21.02C9.4 21.02 0 11.62 0 0.120003C0 -0.479997 0.5 -0.979997 1.1 -0.979997H4.1C4.7 -0.979997 5.2 -0.479997 5.2 0.120003C5.2 1.32 5.4 2.48 5.8 3.58C5.9 3.88 5.8 4.18 5.6 4.38L3.6 6.38C5.1 9.36 7.6 11.86 10.58 13.36L12.58 11.36C12.78 11.16 13.08 11.06 13.38 11.16C14.48 11.56 15.64 11.76 16.84 11.76C17.44 11.76 17.94 12.26 17.94 12.86V15.86C17.94 16.46 17.44 16.92 16.84 16.92H13.84" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{fournisseur.telephone}</span>
                </div>
              )}

              {fournisseur.email && (
                <div className="fournisseur-detail">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{fournisseur.email}</span>
                </div>
              )}

              {fournisseur.adresse && (
                <div className="fournisseur-detail">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{fournisseur.adresse}</span>
                </div>
              )}

              <div className="card-actions">
                <button onClick={() => handleEdit(fournisseur)} className="btn-edit">
                  Modifier
                </button>
                <button onClick={() => handleDeleteClick(fournisseur)} className="btn-delete">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ajout */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Ajouter un fournisseur</h3>
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Nom du fournisseur"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="Type (ex: Grossiste viande, Abattoir...)"
              />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="01 23 45 67 89"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@fournisseur.fr"
              />
            </div>
            <div className="form-group">
              <label>Adresse</label>
              <textarea
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="Adresse complète"
                rows={3}
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.actif}
                  onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                />
                <span>Fournisseur actif</span>
              </label>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddModal(false)} className="btn-cancel">
                Annuler
              </button>
              <button onClick={handleSubmitAdd} className="btn-submit" disabled={loading}>
                {loading ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edition */}
      {showEditModal && selectedFournisseur && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Modifier le fournisseur</h3>
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Nom du fournisseur"
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="Type (ex: Grossiste viande, Abattoir...)"
              />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="01 23 45 67 89"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@fournisseur.fr"
              />
            </div>
            <div className="form-group">
              <label>Adresse</label>
              <textarea
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="Adresse complète"
                rows={3}
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.actif}
                  onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                />
                <span>Fournisseur actif</span>
              </label>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)} className="btn-cancel">
                Annuler
              </button>
              <button onClick={handleSubmitEdit} className="btn-submit" disabled={loading}>
                {loading ? 'Modification...' : 'Modifier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="localhost:5174 indique"
        message={`Voulez-vous vraiment supprimer le fournisseur "${selectedFournisseur?.nom}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedFournisseur(null);
        }}
      />
    </div>
  );
}
