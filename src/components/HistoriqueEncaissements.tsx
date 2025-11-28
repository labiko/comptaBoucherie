import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatMontant, formatMontantAvecDevise } from '../lib/format';
import type { Encaissement } from '../types';
import { format, parseISO, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import './HistoriqueEncaissements.css';

export function HistoriqueEncaissements() {
  const { user } = useAuth();
  const [encaissements, setEncaissements] = useState<Encaissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
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
  }, [user, selectedYear]);

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
      const yearStart = format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd');
      const yearEnd = format(endOfYear(new Date(selectedYear, 11, 31)), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('encaissements')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .gte('date', yearStart)
        .lte('date', yearEnd)
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

  return (
    <div className="historique-encaissements-container">
      <div className="header-section">
        <div className="year-selector">
          <label>Année :</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="total-year-badge">
          Total {selectedYear} : {formatMontantAvecDevise(totalYear)}
        </div>
      </div>

      {encaissements.length === 0 ? (
        <div className="empty-state">
          <p>Aucun encaissement pour l'année {selectedYear}</p>
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
