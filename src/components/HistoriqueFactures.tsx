import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatMontantAvecDevise } from '../lib/format';
import type { Facture, Fournisseur } from '../types';
import { format, parseISO, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import './HistoriqueFactures.css';

export function HistoriqueFactures() {
  const { user } = useAuth();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedFournisseur, setSelectedFournisseur] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);

  useEffect(() => {
    if (user) {
      loadAvailableYears();
      loadFournisseurs();
    }
  }, [user]);

  useEffect(() => {
    if (user && selectedYear) {
      loadFactures();
    }
  }, [user, selectedYear, selectedMonth, selectedFournisseur]);

  async function loadAvailableYears() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('factures')
        .select('date_facture')
        .eq('boucherie_id', user.boucherie_id)
        .order('date_facture', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const years = [...new Set(data.map(f => new Date(f.date_facture).getFullYear()))];
        setAvailableYears(years.sort((a, b) => b - a));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des années:', error);
    }
  }

  async function loadFournisseurs() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('fournisseurs')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .eq('actif', true)
        .order('nom', { ascending: true });

      if (error) throw error;
      setFournisseurs(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error);
    }
  }

  async function loadFactures() {
    if (!user) return;

    try {
      setLoading(true);

      let startDate, endDate;

      if (selectedMonth === 'all') {
        // Filtrer par année uniquement
        startDate = format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd');
        endDate = format(endOfYear(new Date(selectedYear, 11, 31)), 'yyyy-MM-dd');
      } else {
        // Filtrer par mois spécifique
        const monthDate = new Date(selectedYear, selectedMonth as number, 1);
        startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
        endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');
      }

      let query = supabase
        .from('factures')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .gte('date_facture', startDate)
        .lte('date_facture', endDate);

      // Filtre par fournisseur si sélectionné
      if (selectedFournisseur !== 'all') {
        query = query.eq('fournisseur_id', selectedFournisseur);
      }

      const { data, error } = await query.order('date_facture', { ascending: false });

      if (error) throw error;
      setFactures(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalYear = factures.reduce((sum, f) => sum + f.montant, 0);
  const totalSolde = factures.reduce((sum, f) => sum + f.solde_restant, 0);

  if (loading) {
    return (
      <div className="historique-factures-container">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  const months = [
    { value: 'all', label: 'Toute l\'année' },
    { value: 0, label: 'Janvier' },
    { value: 1, label: 'Février' },
    { value: 2, label: 'Mars' },
    { value: 3, label: 'Avril' },
    { value: 4, label: 'Mai' },
    { value: 5, label: 'Juin' },
    { value: 6, label: 'Juillet' },
    { value: 7, label: 'Août' },
    { value: 8, label: 'Septembre' },
    { value: 9, label: 'Octobre' },
    { value: 10, label: 'Novembre' },
    { value: 11, label: 'Décembre' },
  ];

  const periodLabel = selectedMonth === 'all'
    ? `${selectedYear}`
    : `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;

  return (
    <div className="historique-factures-container">
      <div className="header-section">
        <div className="filters-row">
          <div className="year-selector">
            <label>Année :</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="month-selector">
            <label>Mois :</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>

          <div className="fournisseur-selector">
            <label>Fournisseur :</label>
            <select value={selectedFournisseur} onChange={(e) => setSelectedFournisseur(e.target.value)}>
              <option value="all">Tous les fournisseurs</option>
              {fournisseurs.map(fournisseur => (
                <option key={fournisseur.id} value={fournisseur.id}>{fournisseur.nom}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="totals-badges">
          <div className="total-badge">
            Total {periodLabel} : {formatMontantAvecDevise(totalYear)}
          </div>
          <div className="solde-badge">
            Solde restant : {formatMontantAvecDevise(totalSolde)}
          </div>
        </div>
      </div>

      {factures.length === 0 ? (
        <div className="empty-state">
          <p>Aucune facture pour {periodLabel}</p>
        </div>
      ) : (
        <div className="cards-container">
          {factures.map((facture) => (
            <div key={facture.id} className={`facture-card ${facture.solde_restant > 0 ? 'unpaid' : 'paid'}`}>
              <div className="card-header">
                <div className="card-header-row">
                  <div className="card-date-wrapper">
                    <div className="card-date-main">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {format(parseISO(facture.date_facture), 'dd/MM/yyyy', { locale: fr })}
                    </div>
                  </div>
                  <div className={`card-status-badge ${facture.regle ? 'regle' : 'non-regle'}`}>
                    {facture.regle ? 'Réglé' : 'Non réglé'}
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div className="fournisseur-name">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {facture.fournisseur}
                </div>

                <div className="description-text">{facture.description}</div>

                <div className="card-amounts-row">
                  <div className="amount-box primary">
                    <div className="amount-label">Montant</div>
                    <div className="amount-value">{formatMontantAvecDevise(facture.montant)}</div>
                  </div>
                  <div className={`amount-box ${facture.solde_restant > 0 ? 'warning' : 'success'}`}>
                    <div className="amount-label">Solde restant</div>
                    <div className="amount-value">{formatMontantAvecDevise(facture.solde_restant)}</div>
                  </div>
                </div>

                <div className="card-details-grid">
                  <div className="detail-item">
                    <div className="detail-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                      Échéance
                    </div>
                    <div className="detail-value">{format(parseISO(facture.echeance), 'dd/MM/yyyy', { locale: fr })}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      Mode règlement
                    </div>
                    <div className="detail-value">{facture.mode_reglement}</div>
                  </div>
                </div>

                {facture.piece_jointe && (
                  <div className="piece-jointe-link">
                    <a
                      href={facture.piece_jointe}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={facture.piece_jointe_updated_at ? `Ajoutée le ${format(parseISO(facture.piece_jointe_updated_at), 'dd/MM/yyyy HH:mm', { locale: fr })}` : 'Voir la pièce jointe'}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                      </svg>
                      Voir la pièce jointe
                    </a>
                  </div>
                )}
              </div>

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
          ))}
        </div>
      )}
    </div>
  );
}
