import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeProvider';

const SettingsModal = ({ onClose }) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
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
  });

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load each setting
        const keys = Object.keys(settings);
        const loadedSettings = { ...settings };
        
        for (const key of keys) {
          const value = await window.electronAPI.getConfig(key);
          if (value !== undefined) {
            loadedSettings[key] = value;
          }
        }
        
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Handle settings change
  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save settings
  const saveSettings = async () => {
    try {
      // Save each setting
      const keys = Object.keys(settings);
      
      for (const key of keys) {
        await window.electronAPI.setConfig(key, settings[key]);
      }
      
      // Apply theme
      setTheme(settings.theme);
      
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Apply settings without closing
  const applySettings = async () => {
    try {
      // Save each setting
      const keys = Object.keys(settings);
      
      for (const key of keys) {
        await window.electronAPI.setConfig(key, settings[key]);
      }
      
      // Apply theme
      setTheme(settings.theme);
    } catch (error) {
      console.error('Error applying settings:', error);
    }
  };

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} 
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button 
              className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`} 
              onClick={() => setActiveTab('editor')}
            >
              Editor
            </button>
            <button 
              className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`} 
              onClick={() => setActiveTab('ai')}
            >
              AI
            </button>
            <button 
              className={`tab-btn ${activeTab === 'advanced' ? 'active' : ''}`} 
              onClick={() => setActiveTab('advanced')}
            >
              Advanced
            </button>
          </div>
          
          <div className="tab-content">
            {/* General Settings */}
            <div className={`tab-pane ${activeTab === 'general' ? 'active' : ''}`}>
              <h3>Theme</h3>
              <div className="setting-group">
                <label htmlFor="theme-select">Application Theme</label>
                <select 
                  id="theme-select" 
                  value={settings.theme}
                  onChange={e => handleChange('theme', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              
              <h3>Startup</h3>
              <div className="setting-group checkbox">
                <input 
                  type="checkbox" 
                  id="remember-workspace" 
                  checked={settings.rememberWorkspace}
                  onChange={e => handleChange('rememberWorkspace', e.target.checked)}
                />
                <label htmlFor="remember-workspace">Remember workspace on startup</label>
              </div>
              <div className="setting-group checkbox">
                <input 
                  type="checkbox" 
                  id="check-updates" 
                  checked={settings.checkUpdates}
                  onChange={e => handleChange('checkUpdates', e.target.checked)}
                />
                <label htmlFor="check-updates">Check for updates on startup</label>
              </div>
            </div>
            
            {/* Other settings tabs would be similar but with their respective settings */}
            {/* For brevity, only implementing the general tab */}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={applySettings}>Apply</button>
          <button className="btn btn-primary" onClick={saveSettings}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 