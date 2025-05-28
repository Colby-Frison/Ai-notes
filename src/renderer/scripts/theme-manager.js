/**
 * Theme Manager
 * 
 * Handles application theme switching (light/dark/system)
 */

export class ThemeManager {
  constructor() {
    this.currentTheme = 'system';
    this.systemIsDark = false;
    
    // Initialize theme from system preference
    this.initSystemTheme();
    
    // Set up listeners for system theme changes
    this.setupSystemThemeListener();
  }
  
  /**
   * Initialize the system theme detection
   */
  initSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemIsDark = mediaQuery.matches;
  }
  
  /**
   * Set up a listener for system theme changes
   */
  setupSystemThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      this.systemIsDark = e.matches;
      
      // If current theme is 'system', apply the new system theme
      if (this.currentTheme === 'system') {
        this.applyTheme('system');
      }
    });
  }
  
  /**
   * Apply a theme to the application
   * @param {string} theme - The theme to apply ('light', 'dark', or 'system')
   */
  applyTheme(theme) {
    if (!theme) {
      theme = 'system';
    }
    
    this.currentTheme = theme;
    
    // Save theme preference to config
    window.electronAPI.setConfig('theme', theme);
    
    // Determine if we should use dark mode
    let useDarkMode = false;
    
    if (theme === 'dark') {
      useDarkMode = true;
    } else if (theme === 'system') {
      useDarkMode = this.systemIsDark;
    }
    
    // Apply theme to document
    if (useDarkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
    
    // Update theme select in settings if it exists
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.value = theme;
    }
  }
  
  /**
   * Get the current theme
   * @returns {string} The current theme ('light', 'dark', or 'system')
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
  
  /**
   * Check if dark mode is currently active
   * @returns {boolean} True if dark mode is active
   */
  isDarkMode() {
    if (this.currentTheme === 'dark') {
      return true;
    } else if (this.currentTheme === 'system') {
      return this.systemIsDark;
    }
    return false;
  }
} 