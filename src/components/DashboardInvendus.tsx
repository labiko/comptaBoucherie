import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatMontantAvecDevise } from '../lib/format';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import type { CategorieInvendu } from '../types';
import './DashboardInvendus.css';

interface InvenduStats {
  categorie_id: string;
  categorie_nom: string;
  total_semaine_actuelle: number;
  total_semaine_derniere: number;
}

export function DashboardInvendus() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalSemaineActuelle, setTotalSemaineActuelle] = useState(0);
  const [totalSemaineDerniere, setTotalSemaineDerniere] = useState(0);
  const [statsParCategorie, setStatsParCategorie] = useState<InvenduStats[]>([]);

  useEffect(() => {
    if (user) {
      loadInvendusStats();
    }
  }, [user]);

  async function loadInvendusStats() {
    if (!user) return;

    try {
      setLoading(true);

      const now = new Date();

      // Calculer semaine actuelle (dimanche → samedi)
      const thisWeekStart = format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd');
      const thisWeekEnd = format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd');

      // Calculer semaine dernière
      const lastWeekStart = format(startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 }), 'yyyy-MM-dd');
      const lastWeekEnd = format(endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 }), 'yyyy-MM-dd');

      // Total semaine actuelle
      const { data: thisWeekData, error: thisWeekError } = await supabase
        .from('invendus')
        .select('valeur_estimee')
        .eq('boucherie_id', user.boucherie_id)
        .gte('date', thisWeekStart)
        .lte('date', thisWeekEnd);

      if (thisWeekError) throw thisWeekError;

      const totalThisWeek = thisWeekData?.reduce((sum, inv) => sum + Number(inv.valeur_estimee), 0) || 0;
      setTotalSemaineActuelle(totalThisWeek);

      // Total semaine dernière
      const { data: lastWeekData, error: lastWeekError } = await supabase
        .from('invendus')
        .select('valeur_estimee')
        .eq('boucherie_id', user.boucherie_id)
        .gte('date', lastWeekStart)
        .lte('date', lastWeekEnd);

      if (lastWeekError) throw lastWeekError;

      const totalLastWeek = lastWeekData?.reduce((sum, inv) => sum + Number(inv.valeur_estimee), 0) || 0;
      setTotalSemaineDerniere(totalLastWeek);

      // Récupérer les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories_invendus')
        .select('*')
        .eq('actif', true);

      if (categoriesError) throw categoriesError;

      const categories = categoriesData || [];

      // Récupérer les invendus semaine actuelle avec catégories
      const { data: thisWeekInvendus, error: thisWeekInvendusError } = await supabase
        .from('invendus')
        .select('categorie_id, valeur_estimee')
        .eq('boucherie_id', user.boucherie_id)
        .gte('date', thisWeekStart)
        .lte('date', thisWeekEnd);

      if (thisWeekInvendusError) throw thisWeekInvendusError;

      // Récupérer les invendus semaine dernière avec catégories
      const { data: lastWeekInvendus, error: lastWeekInvendusError } = await supabase
        .from('invendus')
        .select('categorie_id, valeur_estimee')
        .eq('boucherie_id', user.boucherie_id)
        .gte('date', lastWeekStart)
        .lte('date', lastWeekEnd);

      if (lastWeekInvendusError) throw lastWeekInvendusError;

      // Calculer les totaux par catégorie pour les 2 semaines
      const statsByCategory: InvenduStats[] = categories.map(cat => {
        const totalThisWeek = thisWeekInvendus
          ?.filter(inv => inv.categorie_id === cat.id)
          .reduce((sum, inv) => sum + Number(inv.valeur_estimee), 0) || 0;

        const totalLastWeek = lastWeekInvendus
          ?.filter(inv => inv.categorie_id === cat.id)
          .reduce((sum, inv) => sum + Number(inv.valeur_estimee), 0) || 0;

        return {
          categorie_id: cat.id,
          categorie_nom: cat.nom,
          total_semaine_actuelle: totalThisWeek,
          total_semaine_derniere: totalLastWeek
        };
      }).filter(stat => stat.total_semaine_actuelle > 0 || stat.total_semaine_derniere > 0)
        .sort((a, b) => b.total_semaine_actuelle - a.total_semaine_actuelle);

      setStatsParCategorie(statsByCategory);

    } catch (error) {
      console.error('Erreur chargement stats invendus:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-invendus-card">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  // Calcul de l'évolution globale
  const evolutionGlobale = totalSemaineDerniere > 0
    ? ((totalSemaineActuelle - totalSemaineDerniere) / totalSemaineDerniere) * 100
    : 0;

  return (
    <div className="dashboard-invendus-card">
      <div className="card-header">
        <h2>📦 INVENDUS DE LA SEMAINE</h2>
      </div>

      <div className="card-body">
        <div className="total-section">
          <div className="total-label">Total de la semaine :</div>
          <div className="total-value">{formatMontantAvecDevise(totalSemaineActuelle)}</div>
        </div>

        {statsParCategorie.length > 0 && (
          <div className="categories-section">
            <h3>📊 Par catégorie :</h3>
            {statsParCategorie.map(stat => {
              const percentage = totalSemaineActuelle > 0
                ? (stat.total_semaine_actuelle / totalSemaineActuelle) * 100
                : 0;

              const evolution = stat.total_semaine_derniere > 0
                ? ((stat.total_semaine_actuelle - stat.total_semaine_derniere) / stat.total_semaine_derniere) * 100
                : 0;

              return (
                <div key={stat.categorie_id} className="category-group">
                  <div className="category-row">
                    <div className="category-name">{stat.categorie_nom}</div>
                    <div className="category-dots"></div>
                    <div className="category-value">
                      {formatMontantAvecDevise(stat.total_semaine_actuelle)} ({percentage.toFixed(0)}%)
                    </div>
                  </div>
                  <div className="category-row-last-week">
                    <div className="last-week-label">└─ Semaine dernière:</div>
                    <div className="category-dots"></div>
                    <div className={`last-week-value ${evolution < 0 ? 'positive' : evolution > 0 ? 'negative' : 'neutral'}`}>
                      {formatMontantAvecDevise(stat.total_semaine_derniere)}
                      {evolution !== 0 && (
                        <span className="evolution-indicator">
                          {' '}({evolution < 0 ? '▼' : '▲'} {Math.abs(evolution).toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="evolution-section">
          <h3>📈 Évolution :</h3>
          <div className={`evolution-value ${evolutionGlobale < 0 ? 'positive' : evolutionGlobale > 0 ? 'negative' : 'neutral'}`}>
            {evolutionGlobale < 0 && '▼'}
            {evolutionGlobale > 0 && '▲'}
            {evolutionGlobale === 0 && '—'}
            {' '}
            {Math.abs(evolutionGlobale).toFixed(1)}% vs semaine dernière
          </div>
        </div>

        <button
          className="btn-details"
          onClick={() => navigate('/administration')}
        >
          Voir le détail →
        </button>
      </div>
    </div>
  );
}
