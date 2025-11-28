import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthState } from '../types';
import { getUserFromStorage, saveUserToStorage, clearUserFromStorage } from '../lib/auth';

interface AuthContextType extends AuthState {
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Charger l'utilisateur depuis le localStorage au démarrage
    const savedUser = getUserFromStorage();
    if (savedUser) {
      setUserState(savedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    setIsAuthenticated(!!newUser);

    if (newUser) {
      saveUserToStorage(newUser);
    } else {
      clearUserFromStorage();
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, setUser, logout }}>
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
