import React, { createContext, useState, useEffect, useContext } from 'react';

// Create context
const ThemeContext = createContext();

// Hook for consuming context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('system');
  const [systemIsDark, setSystemIsDark] = useState(false);

  // Detect system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemIsDark(mediaQuery.matches);

    // Listen for system theme changes
    const handleChange = (e) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load theme from config
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await window.electronAPI.getConfig('theme');
        if (savedTheme) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    loadTheme();
  }, []);

  // Apply theme to document
  useEffect(() => {
    // Determine if we should use dark mode
    let useDarkMode = false;
    
    if (theme === 'dark') {
      useDarkMode = true;
    } else if (theme === 'system') {
      useDarkMode = systemIsDark;
    }
    
    // Apply theme to document
    if (useDarkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }, [theme, systemIsDark]);

  // Context value
  const value = {
    theme,
    setTheme,
    isDarkMode: theme === 'dark' || (theme === 'system' && systemIsDark)
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 