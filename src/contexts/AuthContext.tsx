import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthState } from '../types';
import { getUserFromStorage, saveUserToStorage, clearUserFromStorage } from '../lib/auth';
import { type Secteur, type ModuleConfig, getActiveModules } from '../config/modules';
import { supabase } from '../lib/supabase';

interface AuthContextType extends AuthState {
  setUser: (user: User | null) => void;
  logout: () => void;
  secteur: Secteur;
  activeModules: ModuleConfig[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secteur, setSecteur] = useState<Secteur>('boucherie'); // FALLBACK par défaut

  useEffect(() => {
    // Charger l'utilisateur depuis le localStorage au démarrage
    const savedUser = getUserFromStorage();
    if (savedUser) {
      setUserState(savedUser);
      setIsAuthenticated(true);
      // Charger le secteur de la boucherie
      loadSecteur(savedUser.boucherie_id);
    }
  }, []);

  // Fonction pour charger le secteur depuis la DB
  const loadSecteur = async (boucherieId: string) => {
    try {
      const { data, error } = await supabase
        .from('boucheries')
        .select('secteur')
        .eq('id', boucherieId)
        .single();

      if (error) {
        console.error('Erreur chargement secteur:', error);
        // FALLBACK : En cas d'erreur, on garde 'boucherie'
        setSecteur('boucherie');
        return;
      }

      // FALLBACK : Si pas de secteur en DB, on assume 'boucherie'
      setSecteur((data?.secteur as Secteur) || 'boucherie');
    } catch (err) {
      console.error('Erreur inattendue:', err);
      // FALLBACK : En cas d'erreur, on garde 'boucherie'
      setSecteur('boucherie');
    }
  };

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    setIsAuthenticated(!!newUser);

    if (newUser) {
      saveUserToStorage(newUser);
      // Charger le secteur quand on set un nouveau user
      loadSecteur(newUser.boucherie_id);
    } else {
      clearUserFromStorage();
      // Réinitialiser au fallback
      setSecteur('boucherie');
    }
  };

  const logout = () => {
    setUser(null);
  };

  // Calculer les modules actifs selon le secteur
  const activeModules = getActiveModules(secteur);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      setUser,
      logout,
      secteur,
      activeModules
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
