import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Workspace from './Workspace';
import SettingsModal from './SettingsModal';
import ThemeProvider from '../context/ThemeProvider';

// Try to import the bridge connector if it exists
let connectReactComponents;
try {
  connectReactComponents = require('../../scripts/app.js').connectReactComponents;
} catch (e) {
  console.warn('Could not import connectReactComponents from legacy JavaScript', e);
  connectReactComponents = null;
}

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSidebarPanel, setActiveSidebarPanel] = useState('file-tree-panel');
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [rootDirectory, setRootDirectory] = useState('');
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Create callbacks for file operations that can be passed to the bridge
  const handleSetRootDirectory = useCallback(async (dir) => {
    setRootDirectory(dir);
    await window.electronAPI.setConfig('rootDirectory', dir);
  }, []);

  const handleToggleFolder = useCallback(async (folderPath) => {
    // This would be implemented in the FileTree component
    console.log('Toggle folder:', folderPath);
  }, []);

  const handleOpenFile = useCallback(async (filePath) => {
    // Check if a root directory is set
    if (!rootDirectory) {
      console.error('Cannot open file: No root directory set');
      return;
    }
    
    // Validate file path is within root directory
    const normalizedRootDir = rootDirectory.replace(/\\/g, '/');
    const normalizedFilePath = filePath.replace(/\\/g, '/');
    
    if (!normalizedFilePath.startsWith(normalizedRootDir)) {
      console.error('Cannot open file: File is outside root directory');
      return;
    }
    
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
    }
  }, [openFiles, rootDirectory]);

  const handleCloseFile = useCallback(async (filePath) => {
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
  }, [openFiles, activeFile]);

  // Connect to legacy JavaScript bridge if available
  useEffect(() => {
    if (connectReactComponents) {
      connectReactComponents(
        {
          setRootDirectory: handleSetRootDirectory,
          toggleFolder: handleToggleFolder,
          openFile: handleOpenFile
        },
        {
          openFile: handleOpenFile,
          closeFile: handleCloseFile
        }
      );
      console.log('Connected React components to legacy JavaScript bridge');
    }
  }, [handleSetRootDirectory, handleToggleFolder, handleOpenFile, handleCloseFile]);

  // Load initial state from config
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        // Ensure electronAPI is available
        if (!window.electronAPI) {
          console.error('Electron API not available yet');
          return;
        }
        
        // Get sidebar state
        const collapsed = await window.electronAPI.getConfig('sidebarCollapsed');
        if (collapsed !== undefined) setSidebarCollapsed(collapsed);
        
        // Get active panel
        const panel = await window.electronAPI.getConfig('activeSidebarPanel');
        if (panel) setActiveSidebarPanel(panel);
        
        // Get root directory FIRST - this is critical
        const rootDir = await window.electronAPI.getConfig('rootDirectory');
        if (rootDir) {
          console.log('Root directory found:', rootDir);
          setRootDirectory(rootDir);
          
          // Only load files if we have a root directory
          await loadSavedFiles(rootDir);
        } else {
          console.log('No root directory set - skipping file loading');
        }
      } catch (error) {
        console.error('Error loading initial state:', error);
      }
    };
    
    // Helper function to load saved files
    const loadSavedFiles = async (rootDir) => {
      try {
        // Ensure the root directory is normalized for path comparison
        const normalizedRootDir = rootDir.replace(/\\/g, '/');
        
        // Get open files
        const savedOpenFiles = await window.electronAPI.getConfig('openFiles');
        if (savedOpenFiles && Array.isArray(savedOpenFiles)) {
          // Filter out files that aren't in the root directory
          const validFiles = savedOpenFiles.filter(path => {
            const normalizedPath = path.replace(/\\/g, '/');
            return normalizedPath.startsWith(normalizedRootDir);
          });
          
          if (validFiles.length !== savedOpenFiles.length) {
            console.warn(`Filtered out ${savedOpenFiles.length - validFiles.length} files outside root directory`);
          }
          
          if (validFiles.length > 0) {
            setOpenFiles(validFiles.map(path => ({ 
              path,
              name: path.split(/[/\\]/).pop(),
              content: '',
              loaded: false,
              modified: false
            })));
            
            // Get active file
            const lastActiveFile = await window.electronAPI.getConfig('activeFile');
            // Only set active file if it's in the valid files list
            if (lastActiveFile && validFiles.includes(lastActiveFile)) {
              setActiveFile(lastActiveFile);
            } else if (validFiles.length > 0) {
              // Set first valid file as active if previous active file is invalid
              setActiveFile(validFiles[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved files:', error);
      }
    };

    // Add a small delay to ensure preload script has initialized
    setTimeout(loadInitialState, 100);
  }, []);

  // Handle sidebar toggle
  const toggleSidebar = useCallback(() => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    window.electronAPI.setConfig('sidebarCollapsed', newState);
  }, [sidebarCollapsed]);

  // Handle sidebar panel change
  const changeSidebarPanel = useCallback((panelId) => {
    setActiveSidebarPanel(panelId);
    window.electronAPI.setConfig('activeSidebarPanel', panelId);
  }, []);

  // Open settings modal
  const openSettings = useCallback(() => {
    setSettingsVisible(true);
  }, []);

  // Close settings modal
  const closeSettings = useCallback(() => {
    setSettingsVisible(false);
  }, []);

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
            setRootDirectory={handleSetRootDirectory}
            openFile={handleOpenFile}
            openSettings={openSettings}
          />
          
          <Workspace 
            openFiles={openFiles}
            activeFile={activeFile}
            setActiveFile={setActiveFile}
            closeFile={handleCloseFile}
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