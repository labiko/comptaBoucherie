import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatMontantAvecDevise } from '../lib/format';
import type { Invendu } from '../types';
import { format, parseISO, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import './HistoriqueInvendus.css';

export function HistoriqueInvendus() {
  const { user } = useAuth();
  const [invendus, setInvendus] = useState<Invendu[]>([]);
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
      loadInvendus();
    }
  }, [user, selectedYear, selectedMonth]);

  async function loadAvailableYears() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('invendus')
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

  async function loadInvendus() {
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
        .from('invendus')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setInvendus(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalValeur = invendus.reduce((sum, inv) => sum + inv.valeur_estimee, 0);

  if (loading) {
    return (
      <div className="historique-invendus-container">
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
    <div className="historique-invendus-container">
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
          Total {periodLabel} : {formatMontantAvecDevise(totalValeur)}
        </div>
      </div>

      {invendus.length === 0 ? (
        <div className="empty-state">
          <p>Aucun invendu pour {periodLabel}</p>
        </div>
      ) : (
        <div className="cards-container">
          {invendus.map((inv) => (
            <div key={inv.id} className="invendu-card">
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
                      {format(parseISO(inv.date), 'dd/MM/yyyy', { locale: fr })}
                    </div>
                  </div>
                  <div className="card-total-badge">
                    {formatMontantAvecDevise(inv.valeur_estimee)}
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div className="invendu-produit">{inv.produit}</div>
                <div className="invendu-details">
                  <div className="detail-box">
                    <div className="detail-label">Quantité</div>
                    <div className="detail-value">{inv.quantite}</div>
                  </div>
                  <div className="detail-box">
                    <div className="detail-label">Valeur estimée</div>
                    <div className="detail-value">{formatMontantAvecDevise(inv.valeur_estimee)}</div>
                  </div>
                </div>
                {inv.note && (
                  <div className="invendu-note">
                    📝 {inv.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
