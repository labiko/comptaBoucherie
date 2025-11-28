import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatMontantAvecDevise } from '../lib/format';
import type { Tracabilite } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import './TracabiliteTab.css';

export function TracabiliteTab() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Tracabilite[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filtres
  const [filterTable, setFilterTable] = useState<'all' | 'encaissements' | 'factures'>('all');
  const [filterAction, setFilterAction] = useState<'all' | 'CREATE' | 'UPDATE' | 'DELETE'>('all');

  useEffect(() => {
    if (user) {
      loadLogs();
    }
  }, [user, filterTable, filterAction]);

  async function loadLogs() {
    if (!user) return;

    try {
      setLoading(true);

      let query = supabase
        .from('v_tracabilite_enrichie')
        .select('*')
        .eq('boucherie_id', user.boucherie_id)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (filterTable !== 'all') {
        query = query.eq('table_name', filterTable);
      }

      if (filterAction !== 'all') {
        query = query.eq('action', filterAction);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data as Tracabilite[]) || []);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function getActionColor(action: string) {
    switch (action) {
      case 'CREATE':
        return '#2D7D4C'; // Vert
      case 'UPDATE':
        return '#1565C0'; // Bleu
      case 'DELETE':
        return '#8B1538'; // Rouge
      default:
        return '#666666';
    }
  }

  function getActionLabel(action: string) {
    switch (action) {
      case 'CREATE':
        return 'Création';
      case 'UPDATE':
        return 'Modification';
      case 'DELETE':
        return 'Suppression';
      default:
        return action;
    }
  }

  function getTableLabel(tableName: string) {
    switch (tableName) {
      case 'encaissements':
        return 'Encaissement';
      case 'factures':
        return 'Facture';
      default:
        return tableName;
    }
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  if (loading) {
    return (
      <div className="tracabilite-container">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="tracabilite-container">
      <div className="filters-section">
        <div className="filter-group">
          <label>Type :</label>
          <select value={filterTable} onChange={(e) => setFilterTable(e.target.value as any)}>
            <option value="all">Tous</option>
            <option value="encaissements">Encaissements</option>
            <option value="factures">Factures</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Action :</label>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value as any)}>
            <option value="all">Toutes</option>
            <option value="CREATE">Créations</option>
            <option value="UPDATE">Modifications</option>
            <option value="DELETE">Suppressions</option>
          </select>
        </div>

        <button onClick={loadLogs} className="btn-refresh">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.49 9C19.9828 7.56678 19.1209 6.28536 17.9845 5.27542C16.8482 4.26548 15.4745 3.55976 13.9917 3.22426C12.5089 2.88875 10.9652 2.93434 9.50481 3.35677C8.04437 3.77921 6.71475 4.56472 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4353 15.9556 20.2208 14.4952 20.6432C13.0348 21.0657 11.4911 21.1112 10.0083 20.7757C8.52547 20.4402 7.1518 19.7345 6.01547 18.7246C4.87913 17.7146 4.01717 16.4332 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Actualiser
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <p>Aucune modification enregistrée</p>
        </div>
      ) : (
        <div className="logs-list">
          {logs.map((log) => (
            <div key={log.id} className="log-card">
              <div className="log-header" onClick={() => toggleExpand(log.id)}>
                <div className="log-main-info">
                  <span
                    className="action-badge"
                    style={{ backgroundColor: getActionColor(log.action) }}
                  >
                    {getActionLabel(log.action)}
                  </span>
                  <span className="table-badge">{getTableLabel(log.table_name)}</span>
                  {log.record_date && (
                    <span className="date-badge">
                      {format(parseISO(log.record_date), 'dd/MM/yyyy')}
                    </span>
                  )}
                  {log.montant !== undefined && log.montant !== null && (
                    <span className="montant-badge">{formatMontantAvecDevise(log.montant)}</span>
                  )}
                </div>

                <div className="log-meta-info">
                  <span className="user-info">{log.user_nom}</span>
                  <span className="timestamp-info">
                    {format(parseISO(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </span>
                  <svg
                    className={`expand-icon ${expandedId === log.id ? 'expanded' : ''}`}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {expandedId === log.id && (
                <div className="log-details">
                  {log.old_values && (
                    <div className="values-section">
                      <h4>Anciennes valeurs</h4>
                      <pre>{JSON.stringify(log.old_values, null, 2)}</pre>
                    </div>
                  )}

                  {log.new_values && (
                    <div className="values-section">
                      <h4>Nouvelles valeurs</h4>
                      <pre>{JSON.stringify(log.new_values, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
