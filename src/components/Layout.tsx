import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Boucherie } from '../types';
import { TabBar } from './TabBar';
import './Layout.css';
import versionData from '../../version.json';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [boucherie, setBoucherie] = useState<Boucherie | null>(null);

  useEffect(() => {
    async function loadBoucherie() {
      if (!user?.boucherie_id) return;

      const { data } = await supabase
        .from('boucheries')
        .select('*')
        .eq('id', user.boucherie_id)
        .single();

      if (data) {
        setBoucherie(data as Boucherie);
      }
    }

    loadBoucherie();
  }, [user]);

  // Limiter le nom de la boucherie à 10 caractères
  const boucherieName = boucherie?.nom || 'Compta Boucherie';
  const displayName = boucherieName.length > 10 ? boucherieName.substring(0, 10) + '...' : boucherieName;

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="header-title">
          <h1 className="app-title" title={boucherieName}>{displayName}</h1>
          <span className="app-version">v{versionData.version}</span>
        </div>
        {user && (
          <div className="header-user">
            <span className="user-name">{user.nom}</span>
            <button onClick={logout} className="btn-logout" title="Déconnexion">
              🚪
            </button>
          </div>
        )}
      </header>

      <main className="layout-content">
        {children}
      </main>

      <TabBar />
    </div>
  );
}
