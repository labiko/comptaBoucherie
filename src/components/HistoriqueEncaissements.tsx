import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatMontant, formatMontantAvecDevise } from '../lib/format';
import type { Encaissement } from '../types';
import { format, parseISO, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import './HistoriqueEncaissements.css';

export function HistoriqueEncaissements() {
  const { user } = useAuth();
  const [encaissements, setEncaissements] = useState<Encaissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    if (user) {
      loadAvailableYears();
    }
  }, [user]);

  useEffect(() => {
    if (user && selectedYear) {
      loadEncaissements();
    }
  }, [user, selectedYear, selectedMonth]);

  async function loadAvailableYears() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('encaissements')
        .select('date')
        .eq('boucherie_id', user.boucherie_id)
        .order('date', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const years = [...new Set(data.map(e => new Date(e.date).getFullYear()))];
        setAvailableYears(years.sort((a, b) => b - a));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des années:', error);
    }
  }

  async function loadEncaissements() {
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

      const { data, error } = await supabase
        .from('encaissements')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setEncaissements(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalYear = encaissements.reduce((sum, e) => sum + e.total, 0);

  if (loading) {
    return (
      <div className="historique-encaissements-container">
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
    <div className="historique-encaissements-container">
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
        </div>

        <div className="total-year-badge">
          Total {periodLabel} : {formatMontantAvecDevise(totalYear)}
        </div>
      </div>

      {encaissements.length === 0 ? (
        <div className="empty-state">
          <p>Aucun encaissement pour {periodLabel}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="historique-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Espèce</th>
                <th>CB</th>
                <th>CH/VR</th>
                <th>TR</th>
                <th>Total</th>
                <th>Créé le</th>
              </tr>
            </thead>
            <tbody>
              {encaissements.map((enc) => (
                <tr key={enc.id}>
                  <td className="date-cell">
                    {format(parseISO(enc.date), 'dd/MM/yyyy', { locale: fr })}
                  </td>
                  <td>{formatMontant(enc.espece)}</td>
                  <td>{formatMontant(enc.cb)}</td>
                  <td>{formatMontant(enc.ch_vr)}</td>
                  <td>{formatMontant(enc.tr)}</td>
                  <td className="total-cell">{formatMontant(enc.total)}</td>
                  <td className="created-cell">
                    {format(parseISO(enc.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
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
