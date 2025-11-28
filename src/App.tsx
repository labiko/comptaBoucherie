import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Encaissements } from './pages/Encaissements';
import { Factures } from './pages/Factures';
import { Tracabilite } from './pages/Tracabilite';
import { Historique } from './pages/Historique';
import './App.css';

import type { ReactElement } from 'react';

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Encaissements />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/factures"
        element={
          <ProtectedRoute>
            <Layout>
              <Factures />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tracabilite"
        element={
          <ProtectedRoute>
            <Layout>
              <Tracabilite />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/historique"
        element={
          <ProtectedRoute>
            <Layout>
              <Historique />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
