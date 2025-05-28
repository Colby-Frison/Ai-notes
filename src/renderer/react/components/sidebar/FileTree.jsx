import React, { useState, useEffect } from 'react';

const FileTree = ({ rootDirectory, setRootDirectory, openFile }) => {
  const [treeData, setTreeData] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Load file tree when root directory changes
  useEffect(() => {
    if (rootDirectory) {
      loadDirectoryContents(rootDirectory);
      
      // Load expanded folders from config
      loadExpandedFolders();
    }
  }, [rootDirectory]);

  // Load expanded folders from config
  const loadExpandedFolders = async () => {
    try {
      const saved = await window.electronAPI.getConfig('expandedFolders');
      if (saved && Array.isArray(saved)) {
        setExpandedFolders(new Set(saved));
      }
    } catch (error) {
      console.error('Error loading expanded folders:', error);
    }
  };

  // Save expanded folders to config
  const saveExpandedFolders = async (folders) => {
    try {
      await window.electronAPI.setConfig('expandedFolders', Array.from(folders));
    } catch (error) {
      console.error('Error saving expanded folders:', error);
    }
  };

  // Load directory contents
  const loadDirectoryContents = async (directoryPath) => {
    setLoading(true);
    
    try {
      const result = await window.electronAPI.getDirectoryContents(directoryPath);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setTreeData(result.contents || []);
    } catch (error) {
      console.error('Error loading directory contents:', error);
      // TODO: Show error notification
    } finally {
      setLoading(false);
    }
  };

  // Handle select directory button click
  const handleSelectDirectory = async () => {
    try {
      const result = await window.electronAPI.openDirectory();
      
      if (!result.canceled && result.directory) {
        setRootDirectory(result.directory);
        
        // Save to config
        await window.electronAPI.setConfig('rootDirectory', result.directory);
      } else if (result.error) {
        console.error('Error selecting directory:', result.error);
        // TODO: Show error notification
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      // TODO: Show error notification
    }
  };

  // Toggle folder expansion
  const toggleFolder = async (folderPath) => {
    const newExpandedFolders = new Set(expandedFolders);
    
    if (newExpandedFolders.has(folderPath)) {
      newExpandedFolders.delete(folderPath);
    } else {
      newExpandedFolders.add(folderPath);
    }
    
    setExpandedFolders(newExpandedFolders);
    saveExpandedFolders(newExpandedFolders);
  };

  // Render file tree
  const renderFileTree = () => {
    if (!rootDirectory) {
      return (
        <div className="empty-state">
          <p>No folder selected</p>
          <p>Click 'Select Folder' to choose a root directory</p>
        </div>
      );
    }
    
    if (loading) {
      return <div className="loading">Loading...</div>;
    }
    
    if (treeData.length === 0) {
      return <div className="empty-folder">Empty folder</div>;
    }
    
    return (
      <div className="file-tree-content">
        {treeData.map(item => renderFileItem(item))}
      </div>
    );
  };

  // Render a file or folder item
  const renderFileItem = (item) => {
    if (shouldIgnoreFile(item.name)) {
      return null;
    }
    
    if (item.isDirectory) {
      const isExpanded = expandedFolders.has(item.path);
      
      return (
        <div key={item.path} className="folder-item">
          <div className="file-item-content" onClick={() => toggleFolder(item.path)}>
            <span className={`folder-toggle ${isExpanded ? 'expanded' : ''}`}>▶</span>
            <span className="file-item-icon">📁</span>
            <span className="file-item-name">{item.name}</span>
          </div>
          
          {isExpanded && (
            <FolderChildren folderPath={item.path} openFile={openFile} />
          )}
        </div>
      );
    } else {
      return (
        <div 
          key={item.path} 
          className="file-item"
          onClick={() => openFile(item.path)}
        >
          <span className="file-item-icon">{getFileIcon(item.name)}</span>
          <span className="file-item-name">{item.name}</span>
        </div>
      );
    }
  };

  // Get file icon based on extension
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    // Map extensions to icons
    const iconMap = {
      // Documents
      'md': '📝',
      'txt': '📄',
      'rtf': '📄',
      
      // Images
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'svg': '🖼️',
      'webp': '🖼️',
      'bmp': '🖼️',
      'ico': '🖼️',
      
      // PDFs
      'pdf': '📕',
      
      // Code
      'js': '📜',
      'ts': '📜',
      'html': '📜',
      'css': '📜',
      'json': '📜',
      'xml': '📜',
      'yml': '📜',
      'yaml': '📜',
      
      // Default
      'default': '📄'
    };
    
    return iconMap[extension] || iconMap['default'];
  };

  // Check if a file should be ignored
  const shouldIgnoreFile = (fileName) => {
    // List of patterns to ignore
    const ignorePatterns = [
      '.git',
      'node_modules',
      '.DS_Store',
      'Thumbs.db',
      '*.tmp',
      '*.temp'
    ];
    
    // Check each pattern
    for (const pattern of ignorePatterns) {
      if (pattern.startsWith('*.')) {
        // Extension pattern
        const ext = pattern.substring(1);
        if (fileName.endsWith(ext)) {
          return true;
        }
      } else {
        // Exact match
        if (fileName === pattern) {
          return true;
        }
      }
    }
    
    return false;
  };

  return (
    <div className="sidebar-panel active">
      <div className="panel-header">
        <h2>Files</h2>
        <button 
          className="small-btn"
          onClick={handleSelectDirectory}
        >
          Select Folder
        </button>
      </div>
      <div className="file-tree">
        {renderFileTree()}
      </div>
    </div>
  );
};

// Folder children component (loaded on demand)
const FolderChildren = ({ folderPath, openFile }) => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const result = await window.electronAPI.getDirectoryContents(folderPath);
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        setChildren(result.contents || []);
        setError(null);
      } catch (error) {
        console.error(`Error loading folder ${folderPath}:`, error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadChildren();
  }, [folderPath]);

  if (loading) {
    return <div className="folder-children loading">Loading...</div>;
  }

  if (error) {
    return <div className="folder-children error">Error: {error}</div>;
  }

  if (children.length === 0) {
    return <div className="folder-children empty-folder">Empty folder</div>;
  }

  return (
    <div className="folder-children">
      {children.map(item => {
        if (item.isDirectory) {
          return (
            <div key={item.path} className="folder-item">
              <div className="file-item-content" onClick={() => {}}>
                <span className="folder-toggle">▶</span>
                <span className="file-item-icon">📁</span>
                <span className="file-item-name">{item.name}</span>
              </div>
            </div>
          );
        } else {
          return (
            <div 
              key={item.path} 
              className="file-item"
              onClick={() => openFile(item.path)}
            >
              <span className="file-item-icon">📄</span>
              <span className="file-item-name">{item.name}</span>
            </div>
          );
        }
      })}
    </div>
  );
};

export default FileTree; 