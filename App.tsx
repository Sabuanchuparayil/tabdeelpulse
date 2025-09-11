import React, { useState, useCallback, useEffect } from 'react';
import LoginPage from './components/auth/LoginPage';
import MainLayout from './components/layout/MainLayout';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/common/ErrorBoundary';

const AppContent: React.FC = () => {
  const { user, logout } = useAuth();
  const [isDarkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prevMode => !prevMode);
  }, []);

  if (!user) {
    return <LoginPage />;
  }

  return (
    <ErrorBoundary>
      <MainLayout onLogout={logout} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;