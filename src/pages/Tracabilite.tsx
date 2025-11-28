import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatMontantAvecDevise } from '../lib/format';
import { getChangedFields } from '../lib/tracabilite';
import type { Tracabilite } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ActionBadge } from '../components/ActionBadge';
import { FieldComparison } from '../components/FieldComparison';
import './Tracabilite.css';

export function Tracabilite() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Tracabilite[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
      <div className="tracabilite-page-container">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="tracabilite-page-container">
      <h1 className="page-title">Traçabilité</h1>

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
        <div className="logs-timeline">
          {logs.map((log) => {
            const changedFields = getChangedFields(log.old_values, log.new_values);

            return (
              <div key={log.id} className="change-card">
                <div className="card-header">
                  <div className="header-left">
                    <ActionBadge action={log.action} />
                    <span className="table-label">{getTableLabel(log.table_name)}</span>
                    {log.record_date && (
                      <span className="record-date">
                        {format(parseISO(log.record_date), 'dd/MM/yyyy')}
                      </span>
                    )}
                    {log.montant !== undefined && log.montant !== null && (
                      <span className="record-montant">{formatMontantAvecDevise(log.montant)}</span>
                    )}
                  </div>

                  <div className="header-right">
                    <div className="user-info-compact">
                      <svg className="user-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="user-name">{log.user_nom}</span>
                    </div>

                    <div className="timestamp">
                      <svg className="clock-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{format(parseISO(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                    </div>

                    {((log.action === 'UPDATE' && changedFields.length > 0) ||
                      (log.action === 'CREATE' && log.new_values) ||
                      (log.action === 'DELETE' && log.old_values)) ? (
                      <button
                        className="expand-button"
                        onClick={() => toggleExpand(log.id)}
                        aria-label={expandedId === log.id ? 'Masquer les détails' : 'Voir les détails'}
                      >
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
                      </button>
                    ) : (
                      <div className="expand-placeholder"></div>
                    )}
                  </div>
                </div>

                {log.action === 'UPDATE' && expandedId === log.id && changedFields.length > 0 && (
                  <div className="card-body">
                    <div className="changes-list">
                      {changedFields.map((fieldName) => (
                        <FieldComparison
                          key={fieldName}
                          fieldName={fieldName}
                          oldValue={log.old_values?.[fieldName]}
                          newValue={log.new_values?.[fieldName]}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {log.action === 'CREATE' && expandedId === log.id && log.new_values && (
                  <div className="card-body">
                    <div className="changes-list">
                      {Object.keys(log.new_values)
                        .filter(key => !['id', 'boucherie_id', 'user_id', 'updated_by', 'created_at', 'updated_at'].includes(key))
                        .map((fieldName) => (
                          <FieldComparison
                            key={fieldName}
                            fieldName={fieldName}
                            oldValue={null}
                            newValue={log.new_values?.[fieldName]}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {log.action === 'DELETE' && expandedId === log.id && log.old_values && (
                  <div className="card-body">
                    <div className="changes-list">
                      {Object.keys(log.old_values)
                        .filter(key => !['id', 'boucherie_id', 'user_id', 'updated_by', 'created_at', 'updated_at'].includes(key))
                        .map((fieldName) => (
                          <FieldComparison
                            key={fieldName}
                            fieldName={fieldName}
                            oldValue={log.old_values?.[fieldName]}
                            newValue={null}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
