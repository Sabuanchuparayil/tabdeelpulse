// App.tsx
import React, { useState, useEffect } from "react";
import LoginPage from "./components/auth/LoginPage";
import MainLayout from "./components/layout/MainLayout";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import ErrorBoundary from "./components/common/ErrorBoundary";

const AppContent: React.FC = () => {
  const { user } = useAuth(); // 👈 comes from context
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  if (!user) {
    // 👈 show login until we have a logged-in user
    return <LoginPage />;
  }

  return (
    <MainLayout
      onLogout={() => window.location.reload()} // simple logout: refresh clears context
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
    />
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AuthProvider>
  );
};

export default App;
