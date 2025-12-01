import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatMontantAvecDevise } from '../lib/format';
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
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="month-selector">
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
        <div className="cards-container">
          {encaissements.map((enc) => (
            <div key={enc.id} className="encaissement-card">
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
                      {format(parseISO(enc.date), 'dd/MM/yyyy', { locale: fr })}
                    </div>
                  </div>
                  <div className="card-total-badge">
                    {formatMontantAvecDevise(enc.total)}
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div className="card-amounts">
                  <div className="amount-box">
                    <div className="amount-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
                      </svg>
                      Espèce
                    </div>
                    <div className="amount-value">{formatMontantAvecDevise(enc.espece)}</div>
                  </div>
                  <div className="amount-box">
                    <div className="amount-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      CB
                    </div>
                    <div className="amount-value">{formatMontantAvecDevise(enc.cb)}</div>
                  </div>
                  <div className="amount-box">
                    <div className="amount-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      CH/VR
                    </div>
                    <div className="amount-value">{formatMontantAvecDevise(enc.ch_vr)}</div>
                  </div>
                  <div className="amount-box">
                    <div className="amount-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                      </svg>
                      TR
                    </div>
                    <div className="amount-value">{formatMontantAvecDevise(enc.tr)}</div>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <div className="created-at">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  Créé le {format(parseISO(enc.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
