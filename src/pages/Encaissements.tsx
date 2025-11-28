import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatMontantAvecDevise, formatMontant } from '../lib/format';
import type { Encaissement } from '../types';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import './Encaissements.css';

export function Encaissements() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [encaissements, setEncaissements] = useState<Encaissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    espece: '',
    cb: '',
    ch_vr: '',
    tr: '',
  });

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  useEffect(() => {
    if (user) {
      loadEncaissements();
    }
  }, [user]);

  async function loadEncaissements() {
    if (!user) return;

    try {
      setLoading(true);
      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('encaissements')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false });

      if (error) throw error;
      setEncaissements(data || []);

      // Charger les données du jour si elles existent
      const todayData = data?.find((e) => e.date === todayStr);
      if (todayData) {
        setFormData({
          espece: todayData.espece.toString(),
          cb: todayData.cb.toString(),
          ch_vr: todayData.ch_vr.toString(),
          tr: todayData.tr.toString(),
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    // Validation : tous les champs sont obligatoires
    if (!formData.espece || !formData.cb || !formData.ch_vr || !formData.tr) {
      showError('Tous les champs sont obligatoires. Veuillez saisir un montant pour chaque type de paiement (même 0).');
      return;
    }

    const espece = parseFloat(formData.espece);
    const cb = parseFloat(formData.cb);
    const ch_vr = parseFloat(formData.ch_vr);
    const tr = parseFloat(formData.tr);

    // Vérifier que tous les montants sont valides
    if (isNaN(espece) || isNaN(cb) || isNaN(ch_vr) || isNaN(tr)) {
      showError('Veuillez saisir des montants valides');
      return;
    }

    // Vérifier que tous les montants sont positifs ou nuls
    if (espece < 0 || cb < 0 || ch_vr < 0 || tr < 0) {
      showError('Les montants ne peuvent pas être négatifs');
      return;
    }

    try {
      // Si on est en mode édition
      if (editingId) {
        const { error } = await supabase
          .from('encaissements')
          .update({
            espece,
            cb,
            ch_vr,
            tr,
            updated_by: user.id,
          })
          .eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        // Vérifier s'il existe déjà un encaissement pour cette date
        const existingEncaissement = encaissements.find((e) => e.date === todayStr);

        if (existingEncaissement) {
          // Mettre à jour l'encaissement existant
          const { error } = await supabase
            .from('encaissements')
            .update({
              espece,
              cb,
              ch_vr,
              tr,
              updated_by: user.id,
            })
            .eq('id', existingEncaissement.id);

          if (error) throw error;
        } else {
          // Créer un nouvel encaissement
          const { error } = await supabase
            .from('encaissements')
            .insert({
              boucherie_id: user.boucherie_id,
              date: todayStr,
              espece,
              cb,
              ch_vr,
              tr,
              user_id: user.id,
              updated_by: user.id,
            });

          if (error) throw error;
        }
      }

      // Sauvegarder l'ID avant de réinitialiser
      const savedEditingId = editingId;

      await loadEncaissements();
      showSuccess('Encaissement enregistré !');

      // Si on était en mode édition, scroller vers la ligne modifiée et la mettre en surbrillance
      if (savedEditingId) {
        setHighlightedId(savedEditingId);

        // Attendre que le DOM soit mis à jour, puis scroller
        setTimeout(() => {
          const rowElement = document.querySelector(`[data-encaissement-id="${savedEditingId}"]`);
          if (rowElement) {
            rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);

        // Réinitialiser le formulaire avec les données du jour
        const todayData = encaissements.find((e) => e.date === todayStr);
        if (todayData) {
          setFormData({
            espece: todayData.espece.toString(),
            cb: todayData.cb.toString(),
            ch_vr: todayData.ch_vr.toString(),
            tr: todayData.tr.toString(),
          });
        } else {
          setFormData({ espece: '', cb: '', ch_vr: '', tr: '' });
        }

        // Retirer la surbrillance après 3 secondes
        setTimeout(() => {
          setHighlightedId(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showError('Erreur lors de la sauvegarde');
    }
  }

  function handleEdit(encaissement: Encaissement) {
    setEditingId(encaissement.id);
    setFormData({
      espece: encaissement.espece.toString(),
      cb: encaissement.cb.toString(),
      ch_vr: encaissement.ch_vr.toString(),
      tr: encaissement.tr.toString(),
    });
    // Scroll vers le haut pour voir le formulaire (même technique que le scroll après enregistrement)
    setTimeout(() => {
      const formElement = document.querySelector('.encaissement-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  function handleCancelEdit() {
    setEditingId(null);
    // Recharger les données du jour
    const todayData = encaissements.find((e) => e.date === todayStr);
    if (todayData) {
      setFormData({
        espece: todayData.espece.toString(),
        cb: todayData.cb.toString(),
        ch_vr: todayData.ch_vr.toString(),
        tr: todayData.tr.toString(),
      });
    } else {
      setFormData({ espece: '', cb: '', ch_vr: '', tr: '' });
    }
  }

  function handleInputChange(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  // Calculs des totaux
  const totalDuJour = encaissements.find((e) => e.date === todayStr)?.total || 0;

  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Lundi
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const totalSemaine = encaissements
    .filter((e) => {
      const date = parseISO(e.date);
      return date >= weekStart && date <= weekEnd;
    })
    .reduce((sum, e) => sum + e.total, 0);

  const totalMois = encaissements.reduce((sum, e) => sum + e.total, 0);

  if (loading) {
    return (
      <div className="encaissements-container">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  const editingEncaissement = editingId ? encaissements.find(e => e.id === editingId) : null;

  return (
    <div className="encaissements-container">
      <div className="date-badge">
        <span className="date-text">
          {editingEncaissement
            ? `Édition : ${format(parseISO(editingEncaissement.date), 'EEEE d MMMM yyyy', { locale: fr })}`
            : format(today, 'EEEE d MMMM yyyy', { locale: fr })
          }
        </span>
        <span className="month-total">
          Total mois : {formatMontantAvecDevise(totalMois)}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="encaissement-form">
        <div className="form-header">
          <h2 className="form-title">
            {editingEncaissement ? 'Modifier l\'encaissement' : 'Saisie du jour'}
          </h2>
          {editingEncaissement && (
            <button type="button" onClick={handleCancelEdit} className="btn-cancel">
              Annuler
            </button>
          )}
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="espece">Espèce (€) *</label>
            <input
              type="number"
              id="espece"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={formData.espece}
              onChange={(e) => handleInputChange('espece', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="cb">CB (€) *</label>
            <input
              type="number"
              id="cb"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={formData.cb}
              onChange={(e) => handleInputChange('cb', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="ch_vr">CH/VR (€) *</label>
            <input
              type="number"
              id="ch_vr"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={formData.ch_vr}
              onChange={(e) => handleInputChange('ch_vr', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="tr">TR (€) *</label>
            <input
              type="number"
              id="tr"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={formData.tr}
              onChange={(e) => handleInputChange('tr', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary">
          {editingEncaissement ? 'Enregistrer les modifications' : 'Enregistrer'}
        </button>
      </form>

      <div className="totaux-section">
        <h3 className="section-title">Totaux</h3>

        <div className="totaux-grid">
          <div className="total-card">
            <div className="total-label">Total du jour</div>
            <div className="total-value">{formatMontantAvecDevise(totalDuJour)}</div>
          </div>

          <div className="total-card">
            <div className="total-label">Total de la semaine</div>
            <div className="total-value">{formatMontantAvecDevise(totalSemaine)}</div>
          </div>

          <div className="total-card highlight">
            <div className="total-label">Total du mois</div>
            <div className="total-value">{formatMontantAvecDevise(totalMois)}</div>
          </div>
        </div>
      </div>

      <div className="historique-section">
        <h3 className="section-title">Historique du mois</h3>

        {encaissements.length === 0 ? (
          <div className="empty-state">Aucun encaissement ce mois-ci</div>
        ) : (
          <div className="table-container">
            <table className="encaissements-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Espèce</th>
                  <th>CB</th>
                  <th>CH/VR</th>
                  <th>TR</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {encaissements.map((enc) => (
                  <tr
                    key={enc.id}
                    data-encaissement-id={enc.id}
                    className={`${enc.date === todayStr ? 'today-row' : ''} ${highlightedId === enc.id ? 'highlighted-row' : ''} clickable-row`}
                    onClick={() => handleEdit(enc)}
                  >
                    <td className="date-cell">
                      {format(parseISO(enc.date), 'dd/MM')}
                    </td>
                    <td>{formatMontant(enc.espece)}</td>
                    <td>{formatMontant(enc.cb)}</td>
                    <td>{formatMontant(enc.ch_vr)}</td>
                    <td>{formatMontant(enc.tr)}</td>
                    <td className="total-cell">{formatMontant(enc.total)}</td>
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
