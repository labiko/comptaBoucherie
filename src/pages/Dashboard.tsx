import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatMontantAvecDevise } from '../lib/format';
import { DashboardCard } from '../components/DashboardCard';
import { WeekChart } from '../components/WeekChart';
import { PaymentPieChart } from '../components/PaymentPieChart';
import { ProgressBar } from '../components/ProgressBar';
import type { DashboardStats, WeekData, FactureRetard, FournisseurImpaye, PaymentDistribution } from '../types';
import './Dashboard.css';

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [previousWeekData, setPreviousWeekData] = useState<WeekData[]>([]);
  const [facturesRetard, setFacturesRetard] = useState<FactureRetard[]>([]);
  const [topFournisseurs, setTopFournisseurs] = useState<FournisseurImpaye[]>([]);
  const [loading, setLoading] = useState(true);

  // Objectif mensuel par défaut (peut être paramétrable plus tard)
  const OBJECTIF_MENSUEL = 50000;

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  async function loadDashboardData() {
    if (!user) return;

    try {
      setLoading(true);

      // DEBUG: Logs pour vérifier l'environnement
      console.log('========== DEBUG DASHBOARD ==========');
      console.log('VITE_NODE_ENV:', import.meta.env.VITE_NODE_ENV);
      console.log('VITE_DEV_SUPABASE_URL:', import.meta.env.VITE_DEV_SUPABASE_URL);
      console.log('VITE_PROD_SUPABASE_URL:', import.meta.env.VITE_PROD_SUPABASE_URL);
      console.log('VITE_SUPABASE_URL (Vercel):', import.meta.env.VITE_SUPABASE_URL);
      console.log('=====================================');

      // Charger les stats globales
      const { data: statsData, error: statsError } = await supabase
        .from('v_dashboard_stats')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .single();

      if (statsError) throw statsError;
      console.log('📊 Stats chargées:', statsData);
      setStats(statsData);

      // Charger les données de la semaine
      const { data: weekDataRes, error: weekError } = await supabase
        .from('v_dashboard_week')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .order('date', { ascending: true });

      if (weekError) throw weekError;
      setWeekData(weekDataRes || []);

      // Charger les données de la semaine précédente
      // Calculer les dates de la semaine précédente
      const today = new Date();
      const currentDayOfWeek = today.getDay(); // 0 = Dimanche, 1 = Lundi, ...
      const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

      // Date de lundi de cette semaine
      const thisMonday = new Date(today);
      thisMonday.setDate(today.getDate() - daysToMonday);
      thisMonday.setHours(0, 0, 0, 0);

      // Date de lundi de la semaine précédente
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);

      // Date de dimanche de la semaine précédente
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);

      const { data: previousWeekDataRes, error: previousWeekError } = await supabase
        .from('encaissements')
        .select('date, espece, cb, ch_vr, tr')
        .eq('boucherie_id', user.boucherie_id)
        .gte('date', lastMonday.toISOString().split('T')[0])
        .lte('date', lastSunday.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (previousWeekError) throw previousWeekError;

      // Grouper et formater les données de la semaine précédente
      const previousWeekFormatted = (previousWeekDataRes || []).reduce((acc: any[], enc: any) => {
        const existing = acc.find(item => item.date === enc.date);
        const total = enc.espece + enc.cb + enc.ch_vr + enc.tr;

        if (existing) {
          existing.total += total;
        } else {
          const encDate = new Date(enc.date + 'T00:00:00');
          const dayOfWeek = encDate.getDay();
          const daysShort = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

          acc.push({
            boucherie_id: user.boucherie_id,
            date: enc.date,
            jour_court: daysShort[dayOfWeek],
            date_format: encDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            total: total
          });
        }
        return acc;
      }, []);

      setPreviousWeekData(previousWeekFormatted);

      // Charger les factures en retard
      const { data: retardData, error: retardError } = await supabase
        .from('v_dashboard_factures_retard')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .limit(5);

      if (retardError) throw retardError;
      setFacturesRetard(retardData || []);

      // Charger top fournisseurs impayés
      const { data: topData, error: topError } = await supabase
        .from('v_dashboard_top_fournisseurs_impayes')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .limit(3);

      if (topError) throw topError;
      setTopFournisseurs(topData || []);

    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Chargement du dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-container">
        <div className="error-state">Impossible de charger les données</div>
      </div>
    );
  }

  // Calcul des variations
  const variationJ7 = stats.recette_j7 > 0
    ? ((stats.recette_jour - stats.recette_j7) / stats.recette_j7) * 100
    : 0;

  const variationSemaine = stats.recette_semaine_derniere > 0
    ? ((stats.recette_jour - stats.recette_semaine_derniere) / stats.recette_semaine_derniere) * 100
    : 0;

  // Calculer le total de la semaine actuelle
  const totalSemaineActuelle = weekData.reduce((sum, item) => sum + item.total, 0);

  // Répartition des paiements
  const paymentData: PaymentDistribution[] = [
    { name: 'Espèce', value: stats.total_espece, color: '#2D7D4C' },
    { name: 'CB', value: stats.total_cb, color: '#1565C0' },
    { name: 'Chèque/Vir.', value: stats.total_ch_vr, color: '#FF9800' },
    { name: 'TR', value: stats.total_tr, color: '#9C27B0' },
  ];

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>

      <div className="dashboard-grid">
        {/* Recette du jour */}
        <DashboardCard
          title="Recette du Jour"
          className="highlight"
        >
          <div className="stat-value">{formatMontantAvecDevise(stats.recette_jour)}</div>
          <div style={{ fontSize: '14px', color: '#999', marginTop: '8px', marginBottom: '4px' }}>
            Semaine dernière : {formatMontantAvecDevise(stats.recette_semaine_derniere)}
          </div>
          <div style={{ fontSize: '16px', color: '#8B1538', fontWeight: '600', marginBottom: '12px' }}>
            Semaine actuelle : {formatMontantAvecDevise(totalSemaineActuelle)}
          </div>
          <div className="stat-comparisons">
            <div className={`stat-comparison ${variationJ7 >= 0 ? 'positive' : 'negative'}`}>
              {variationJ7 >= 0 ? '↑' : '↓'} {Math.abs(variationJ7).toFixed(1)}% vs J-7
            </div>
            <div className={`stat-comparison ${variationSemaine >= 0 ? 'positive' : 'negative'}`}>
              {variationSemaine >= 0 ? '↑' : '↓'} {Math.abs(variationSemaine).toFixed(1)}% vs semaine dernière
            </div>
          </div>
        </DashboardCard>

        {/* Tendance hebdomadaire */}
        <DashboardCard
          title="Tendance Hebdomadaire"
          className="col-span-2"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="#8B1538" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 6H23V12" stroke="#8B1538" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        >
          <WeekChart data={weekData} previousWeekData={previousWeekData} />
        </DashboardCard>

        {/* Alertes factures */}
        <DashboardCard
          title="Factures en Retard"
          className={stats.nb_factures_retard > 0 ? 'danger' : 'success'}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M10.29 3.86L1.82 18C1.64537 18.3024 1.55295 18.6453 1.55198 18.9945C1.55101 19.3437 1.64151 19.6871 1.81441 19.9905C1.98731 20.2939 2.23645 20.5467 2.53666 20.7239C2.83687 20.9011 3.17809 20.9962 3.52599 21H20.46C20.8076 20.9958 21.1483 20.9006 21.4478 20.7236C21.7473 20.5465 21.9959 20.294 22.1683 19.991C22.3407 19.6879 22.4309 19.3451 22.43 18.9965C22.429 18.6479 22.3369 18.3056 22.163 18.003L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3437 2.89725 12 2.89725C11.6563 2.89725 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4683 3.56611 10.29 3.86V3.86Z" stroke={stats.nb_factures_retard > 0 ? '#FF6B6B' : '#2D7D4C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 9V13" stroke={stats.nb_factures_retard > 0 ? '#FF6B6B' : '#2D7D4C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 17H12.01" stroke={stats.nb_factures_retard > 0 ? '#FF6B6B' : '#2D7D4C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        >
          {stats.nb_factures_retard > 0 ? (
            <>
              <div className="alert-count">{stats.nb_factures_retard} facture{stats.nb_factures_retard > 1 ? 's' : ''} &gt; 30 jours</div>
              <div className="alert-montant">Montant total : {formatMontantAvecDevise(stats.montant_factures_retard)}</div>
              {facturesRetard.length > 0 && (
                <div className="factures-retard-list">
                  {facturesRetard.map(facture => (
                    <div key={facture.id} className="facture-retard-item">
                      <div className="facture-retard-fournisseur">{facture.fournisseur}</div>
                      <div className="facture-retard-details">
                        {formatMontantAvecDevise(facture.solde_restant)} • {facture.jours_retard}j de retard
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="success-message">✓ Aucune facture en retard</div>
          )}
        </DashboardCard>

        {/* Objectif mensuel */}
        <DashboardCard
          title="Objectif Mensuel"
          className="col-span-2"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#8B1538" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 6L12 12L16 14" stroke="#8B1538" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        >
          <ProgressBar
            current={stats.total_mois}
            target={OBJECTIF_MENSUEL}
          />
          <div className="objectif-details">
            <div className="objectif-montants">
              <span className="objectif-current">{formatMontantAvecDevise(stats.total_mois)}</span>
              <span className="objectif-separator">/</span>
              <span className="objectif-target">{formatMontantAvecDevise(OBJECTIF_MENSUEL)}</span>
            </div>
            <div className="objectif-restant">
              Reste {formatMontantAvecDevise(Math.max(0, OBJECTIF_MENSUEL - stats.total_mois))} à réaliser
            </div>
          </div>
        </DashboardCard>

        {/* Répartition paiements */}
        <DashboardCard
          title="Répartition Paiements (Mois)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21.21 15.89C20.5738 17.3945 19.5788 18.7202 18.3119 19.7513C17.0449 20.7824 15.5447 21.4874 13.9424 21.8048C12.3401 22.1221 10.6845 22.0421 9.12066 21.5718C7.55684 21.1015 6.13293 20.2551 4.96912 19.1067C3.80532 17.9582 2.94 16.5428 2.45347 14.9839C1.96695 13.4251 1.87247 11.7704 2.17766 10.1646C2.48284 8.55886 3.17722 7.05063 4.19986 5.77203C5.22249 4.49343 6.54383 3.48332 8.04398 2.83" stroke="#8B1538" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 12C22 10.6868 21.7413 9.38642 21.2388 8.17317C20.7362 6.95991 19.9997 5.85752 19.0711 4.92893C18.1425 4.00035 17.0401 3.26375 15.8268 2.7612C14.6136 2.25866 13.3132 2 12 2V12H22Z" stroke="#8B1538" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        >
          <PaymentPieChart data={paymentData} />
        </DashboardCard>

        {/* Top fournisseurs impayés */}
        <DashboardCard
          title="Top Fournisseurs Impayés"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#8B1538" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#8B1538" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="#8B1538" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#8B1538" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        >
          {topFournisseurs.length > 0 ? (
            <div className="top-fournisseurs-list">
              {topFournisseurs.map((fournisseur, index) => (
                <div key={index} className="top-fournisseur-item">
                  <div className="top-fournisseur-rank">{index + 1}</div>
                  <div className="top-fournisseur-info">
                    <div className="top-fournisseur-nom">{fournisseur.fournisseur}</div>
                    <div className="top-fournisseur-details">
                      {fournisseur.nb_factures} facture{fournisseur.nb_factures > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="top-fournisseur-montant">
                    {formatMontantAvecDevise(fournisseur.montant_total)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="success-message">✓ Aucun impayé</div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
