import React, { useState, useCallback, useEffect } from 'react';
import LoginPage from './components/auth/LoginPage';
import MainLayout from './components/layout/MainLayout';
import { AuthProvider } from './hooks/useAuth';
import ErrorBoundary from './components/common/ErrorBoundary';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
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

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prevMode => !prevMode);
  }, []);

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AuthProvider>
      <ErrorBoundary>
        <MainLayout onLogout={handleLogout} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      </ErrorBoundary>
    </AuthProvider>
  );
};

export default App;