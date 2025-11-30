import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatMontant, formatMontantAvecDevise } from '../lib/format';
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
        <div className="table-container">
          <table className="historique-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Fournisseur</th>
                <th>Description</th>
                <th>Échéance</th>
                <th>Montant</th>
                <th>Solde restant</th>
                <th>Réglé</th>
                <th>Mode règlement</th>
                <th>PJ</th>
                <th>Créé le</th>
              </tr>
            </thead>
            <tbody>
              {factures.map((facture) => (
                <tr key={facture.id} className={facture.solde_restant > 0 ? 'unpaid-row' : ''}>
                  <td className="date-cell">
                    {format(parseISO(facture.date_facture), 'dd/MM/yyyy', { locale: fr })}
                  </td>
                  <td className="fournisseur-cell">{facture.fournisseur}</td>
                  <td className="description-cell">{facture.description}</td>
                  <td className="echeance-cell">
                    {format(parseISO(facture.echeance), 'dd/MM/yyyy', { locale: fr })}
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
                        title={facture.piece_jointe_updated_at ? `Ajoutée le ${format(parseISO(facture.piece_jointe_updated_at), 'dd/MM/yyyy HH:mm', { locale: fr })}` : 'Voir la pièce jointe'}
                      >
                        📎
                      </a>
                    )}
                  </td>
                  <td className="created-cell">
                    {format(parseISO(facture.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
