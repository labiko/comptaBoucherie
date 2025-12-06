import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MobileAccessGuard } from './components/MobileAccessGuard';
import { Layout } from './components/Layout';
import { InstallPrompt } from './components/InstallPrompt';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Encaissements } from './pages/Encaissements';
import { Factures } from './pages/Factures';
import { Administration } from './pages/Administration';
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
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/encaissements"
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
        path="/administration"
        element={
          <ProtectedRoute>
            <Layout>
              <Administration />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/historique"
        element={<Navigate to="/administration" replace />}
      />

      <Route
        path="/comptabilite"
        element={<Navigate to="/administration" replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MobileAccessGuard>
          <NotificationProvider>
            <AppRoutes />
            <InstallPrompt />
          </NotificationProvider>
        </MobileAccessGuard>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
