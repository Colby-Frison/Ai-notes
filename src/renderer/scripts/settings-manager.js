/**
 * Settings Manager
 * 
 * Handles application settings and preferences
 */

import { ThemeManager } from './theme-manager.js';

export class SettingsManager {
  constructor() {
    this.settings = {
      // General settings
      theme: 'system',
      rememberWorkspace: true,
      checkUpdates: true,
      
      // Editor settings
      fontFamily: 'system-ui',
      fontSize: 16,
      tabSize: 2,
      wordWrap: true,
      autoSave: 30000, // milliseconds
      
      // AI settings
      apiKey: '',
      temperature: 0.7,
      maxTokens: 2048,
      includeFileContext: true,
      
      // Advanced settings
      hardwareAcceleration: true,
      memoryLimit: 250, // MB
      debugMode: false,
      verboseLogging: false
    };
  }
  
  /**
   * Load settings from config
   */
  async loadSettings() {
    try {
      // Load each setting individually
      for (const key in this.settings) {
        const value = await window.electronAPI.getConfig(key);
        
        // Only update if the value exists and is not undefined
        if (value !== undefined) {
          this.settings[key] = value;
        }
      }
      
      // Apply settings that affect the UI
      this.applyUISettings();
      
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  /**
   * Apply settings that affect the UI
   */
  applyUISettings() {
    // Apply theme
    const themeManager = new ThemeManager();
    themeManager.applyTheme(this.settings.theme);
    
    // Apply font settings to document
    document.documentElement.style.setProperty('--font-size-base', `${this.settings.fontSize}px`);
    
    if (this.settings.fontFamily) {
      document.documentElement.style.setProperty('--font-code', this.settings.fontFamily);
    }
  }
  
  /**
   * Save settings to config
   */
  async saveSettings() {
    try {
      // Get values from form
      this.collectSettingsFromForm();
      
      // Save each setting individually
      for (const key in this.settings) {
        await window.electronAPI.setConfig(key, this.settings[key]);
      }
      
      // Apply settings that affect the UI
      this.applyUISettings();
      
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
  
  /**
   * Collect settings from the settings form
   */
  collectSettingsFromForm() {
    // General settings
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      this.settings.theme = themeSelect.value;
    }
    
    const rememberWorkspace = document.getElementById('remember-workspace');
    if (rememberWorkspace) {
      this.settings.rememberWorkspace = rememberWorkspace.checked;
    }
    
    const checkUpdates = document.getElementById('check-updates');
    if (checkUpdates) {
      this.settings.checkUpdates = checkUpdates.checked;
    }
    
    // Editor settings
    const fontFamily = document.getElementById('font-family');
    if (fontFamily) {
      this.settings.fontFamily = fontFamily.value;
    }
    
    const fontSize = document.getElementById('font-size');
    if (fontSize) {
      this.settings.fontSize = parseInt(fontSize.value, 10);
    }
    
    const tabSize = document.getElementById('tab-size');
    if (tabSize) {
      this.settings.tabSize = parseInt(tabSize.value, 10);
    }
    
    const wordWrap = document.getElementById('word-wrap');
    if (wordWrap) {
      this.settings.wordWrap = wordWrap.checked;
    }
    
    const autoSave = document.getElementById('auto-save');
    if (autoSave) {
      this.settings.autoSave = parseInt(autoSave.value, 10);
    }
    
    // AI settings
    const apiKey = document.getElementById('api-key');
    if (apiKey) {
      this.settings.apiKey = apiKey.value;
    }
    
    const temperature = document.getElementById('temperature');
    if (temperature) {
      this.settings.temperature = parseFloat(temperature.value);
    }
    
    const maxTokens = document.getElementById('max-tokens');
    if (maxTokens) {
      this.settings.maxTokens = parseInt(maxTokens.value, 10);
    }
    
    const includeFileContext = document.getElementById('include-file-context');
    if (includeFileContext) {
      this.settings.includeFileContext = includeFileContext.checked;
    }
    
    // Advanced settings
    const hardwareAcceleration = document.getElementById('hardware-acceleration');
    if (hardwareAcceleration) {
      this.settings.hardwareAcceleration = hardwareAcceleration.checked;
    }
    
    const memoryLimit = document.getElementById('memory-limit');
    if (memoryLimit) {
      this.settings.memoryLimit = parseInt(memoryLimit.value, 10);
    }
    
    const debugMode = document.getElementById('debug-mode');
    if (debugMode) {
      this.settings.debugMode = debugMode.checked;
    }
    
    const verboseLogging = document.getElementById('verbose-logging');
    if (verboseLogging) {
      this.settings.verboseLogging = verboseLogging.checked;
    }
  }
  
  /**
   * Populate the settings form with current values
   */
  populateSettingsForm() {
    // General settings
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.value = this.settings.theme;
    }
    
    const rememberWorkspace = document.getElementById('remember-workspace');
    if (rememberWorkspace) {
      rememberWorkspace.checked = this.settings.rememberWorkspace;
    }
    
    const checkUpdates = document.getElementById('check-updates');
    if (checkUpdates) {
      checkUpdates.checked = this.settings.checkUpdates;
    }
    
    // Editor settings
    const fontFamily = document.getElementById('font-family');
    if (fontFamily) {
      fontFamily.value = this.settings.fontFamily;
    }
    
    const fontSize = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    if (fontSize) {
      fontSize.value = this.settings.fontSize;
      if (fontSizeValue) {
        fontSizeValue.textContent = `${this.settings.fontSize}px`;
      }
    }
    
    const tabSize = document.getElementById('tab-size');
    if (tabSize) {
      tabSize.value = this.settings.tabSize;
    }
    
    const wordWrap = document.getElementById('word-wrap');
    if (wordWrap) {
      wordWrap.checked = this.settings.wordWrap;
    }
    
    const autoSave = document.getElementById('auto-save');
    if (autoSave) {
      autoSave.value = this.settings.autoSave;
    }
    
    // AI settings
    const apiKey = document.getElementById('api-key');
    if (apiKey) {
      apiKey.value = this.settings.apiKey;
    }
    
    const temperature = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperature-value');
    if (temperature) {
      temperature.value = this.settings.temperature;
      if (temperatureValue) {
        temperatureValue.textContent = this.settings.temperature;
      }
    }
    
    const maxTokens = document.getElementById('max-tokens');
    if (maxTokens) {
      maxTokens.value = this.settings.maxTokens;
    }
    
    const includeFileContext = document.getElementById('include-file-context');
    if (includeFileContext) {
      includeFileContext.checked = this.settings.includeFileContext;
    }
    
    // Advanced settings
    const hardwareAcceleration = document.getElementById('hardware-acceleration');
    if (hardwareAcceleration) {
      hardwareAcceleration.checked = this.settings.hardwareAcceleration;
    }
    
    const memoryLimit = document.getElementById('memory-limit');
    if (memoryLimit) {
      memoryLimit.value = this.settings.memoryLimit;
    }
    
    const debugMode = document.getElementById('debug-mode');
    if (debugMode) {
      debugMode.checked = this.settings.debugMode;
    }
    
    const verboseLogging = document.getElementById('verbose-logging');
    if (verboseLogging) {
      verboseLogging.checked = this.settings.verboseLogging;
    }
    
    // Set up live update for range inputs
    this.setupRangeInputs();
  }
  
  /**
   * Set up range input live updates
   */
  setupRangeInputs() {
    // Font size range
    const fontSize = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    
    if (fontSize && fontSizeValue) {
      fontSize.addEventListener('input', () => {
        fontSizeValue.textContent = `${fontSize.value}px`;
      });
    }
    
    // Temperature range
    const temperature = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperature-value');
    
    if (temperature && temperatureValue) {
      temperature.addEventListener('input', () => {
        temperatureValue.textContent = temperature.value;
      });
    }
  }
  
  /**
   * Get a setting value
   * @param {string} key - The setting key
   * @returns {*} The setting value
   */
  getSetting(key) {
    return this.settings[key];
  }
  
  /**
   * Set a setting value
   * @param {string} key - The setting key
   * @param {*} value - The setting value
   */
  async setSetting(key, value) {
    this.settings[key] = value;
    await window.electronAPI.setConfig(key, value);
    
    // Apply UI settings if necessary
    if (['theme', 'fontFamily', 'fontSize'].includes(key)) {
      this.applyUISettings();
    }
  }
} 