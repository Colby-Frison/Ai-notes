import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Workspace from './Workspace';
import SettingsModal from './SettingsModal';
import ThemeProvider from '../context/ThemeProvider';

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSidebarPanel, setActiveSidebarPanel] = useState('file-tree-panel');
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [rootDirectory, setRootDirectory] = useState('');
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Load initial state from config
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        // Get sidebar state
        const collapsed = await window.electronAPI.getConfig('sidebarCollapsed');
        if (collapsed !== undefined) setSidebarCollapsed(collapsed);
        
        // Get active panel
        const panel = await window.electronAPI.getConfig('activeSidebarPanel');
        if (panel) setActiveSidebarPanel(panel);
        
        // Get root directory
        const rootDir = await window.electronAPI.getConfig('rootDirectory');
        if (rootDir) setRootDirectory(rootDir);
        
        // Get open files
        const savedOpenFiles = await window.electronAPI.getConfig('openFiles');
        if (savedOpenFiles && Array.isArray(savedOpenFiles)) {
          setOpenFiles(savedOpenFiles.map(path => ({ 
            path,
            name: path.split(/[/\\]/).pop(),
            content: '',
            loaded: false,
            modified: false
          })));
        }
        
        // Get active file
        const lastActiveFile = await window.electronAPI.getConfig('activeFile');
        if (lastActiveFile) setActiveFile(lastActiveFile);
      } catch (error) {
        console.error('Error loading initial state:', error);
      }
    };

    loadInitialState();
  }, []);

  // Handle sidebar toggle
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    window.electronAPI.setConfig('sidebarCollapsed', newState);
  };

  // Handle sidebar panel change
  const changeSidebarPanel = (panelId) => {
    setActiveSidebarPanel(panelId);
    window.electronAPI.setConfig('activeSidebarPanel', panelId);
  };

  // Handle file open
  const openFile = async (filePath) => {
    // Check if file is already open
    if (openFiles.some(file => file.path === filePath)) {
      setActiveFile(filePath);
      return;
    }

    try {
      const result = await window.electronAPI.readFile(filePath);
      
      if (result.error) {
        throw new Error(result.error);
      }

      const fileName = filePath.split(/[/\\]/).pop();
      
      const newFile = {
        path: filePath,
        name: fileName,
        content: result.content,
        loaded: true,
        modified: false
      };

      setOpenFiles(prev => [...prev, newFile]);
      setActiveFile(filePath);
      
      // Save to config
      const openFilePaths = [...openFiles.map(file => file.path), filePath];
      await window.electronAPI.setConfig('openFiles', openFilePaths);
      await window.electronAPI.setConfig('activeFile', filePath);
    } catch (error) {
      console.error('Error opening file:', error);
      // TODO: Show error notification
    }
  };

  // Handle file close
  const closeFile = async (filePath) => {
    // TODO: Check for unsaved changes and prompt to save

    setOpenFiles(prev => prev.filter(file => file.path !== filePath));
    
    if (activeFile === filePath) {
      const remainingFiles = openFiles.filter(file => file.path !== filePath);
      if (remainingFiles.length > 0) {
        setActiveFile(remainingFiles[0].path);
      } else {
        setActiveFile(null);
      }
    }

    // Save to config
    const openFilePaths = openFiles
      .filter(file => file.path !== filePath)
      .map(file => file.path);
      
    await window.electronAPI.setConfig('openFiles', openFilePaths);
    
    if (activeFile === filePath && openFilePaths.length > 0) {
      await window.electronAPI.setConfig('activeFile', openFilePaths[0]);
    } else if (activeFile === filePath) {
      await window.electronAPI.setConfig('activeFile', null);
    }
  };

  // Open settings modal
  const openSettings = () => {
    setSettingsVisible(true);
  };

  // Close settings modal
  const closeSettings = () => {
    setSettingsVisible(false);
  };

  return (
    <ThemeProvider>
      <div className="app-container">
        <div className="title-bar">
          <div className="title">AI Notes</div>
        </div>
        
        <div className="main-content">
          <Sidebar 
            collapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activePanel={activeSidebarPanel}
            changePanel={changeSidebarPanel}
            rootDirectory={rootDirectory}
            setRootDirectory={setRootDirectory}
            openFile={openFile}
            openSettings={openSettings}
          />
          
          <Workspace 
            openFiles={openFiles}
            activeFile={activeFile}
            setActiveFile={setActiveFile}
            closeFile={closeFile}
          />
        </div>
      </div>
      
      {settingsVisible && (
        <SettingsModal onClose={closeSettings} />
      )}
    </ThemeProvider>
  );
};

export default App; 