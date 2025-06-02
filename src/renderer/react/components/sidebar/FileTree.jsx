import React, { useState, useEffect, useCallback } from 'react';

// File Tree component - container for the entire file structure
const FileTree = ({ rootDirectory, setRootDirectory, openFile }) => {
  const [rootItems, setRootItems] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Load expanded folders from config
  useEffect(() => {
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

    if (rootDirectory) {
      loadExpandedFolders();
    }
  }, [rootDirectory]);

  // Load directory contents when root directory changes
  useEffect(() => {
    const loadRootDirectory = async () => {
      if (rootDirectory) {
        setLoading(true);
        try {
          const result = await window.electronAPI.getDirectoryContents(rootDirectory);
          if (result.error) {
            throw new Error(result.error);
          }
          
          // Sort items (directories first, then alphabetically)
          const sortedItems = sortItems(result.contents || []);
          setRootItems(sortedItems);
        } catch (error) {
          console.error('Error loading directory contents:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadRootDirectory();
  }, [rootDirectory]);

  // Toggle folder expansion
  const toggleFolder = useCallback(async (folderPath) => {
    console.log('Toggling folder:', folderPath);
    
    // Create a new Set to avoid mutating state directly
    const newExpandedFolders = new Set(expandedFolders);
    
    if (newExpandedFolders.has(folderPath)) {
      newExpandedFolders.delete(folderPath);
    } else {
      newExpandedFolders.add(folderPath);
    }
    
    // Update state
    setExpandedFolders(newExpandedFolders);
    
    // Save to config
    try {
      await window.electronAPI.setConfig('expandedFolders', Array.from(newExpandedFolders));
    } catch (error) {
      console.error('Error saving expanded folders:', error);
    }
  }, [expandedFolders]);

  // Helper to sort items - directories first, then alphabetically
  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      // Directories first
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      
      // Then alphabetically
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  };

  // Handle select directory button
  const handleSelectDirectory = async () => {
    try {
      const result = await window.electronAPI.openDirectory();
      
      if (!result.canceled && result.directory) {
        setRootDirectory(result.directory);
        await window.electronAPI.setConfig('rootDirectory', result.directory);
      } else if (result.error) {
        console.error('Error selecting directory:', result.error);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
  };

  // Render the file tree content based on state
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
    
    if (rootItems.length === 0) {
      return <div className="empty-folder">Empty folder</div>;
    }
    
    return (
      <div className="file-tree-content">
        {rootItems.map(item => 
          !shouldIgnoreFile(item.name) && (
            item.isDirectory ? (
              <FolderItem 
                key={item.path}
                folder={item}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                openFile={openFile}
              />
            ) : (
              <FileItem 
                key={item.path}
                file={item}
                openFile={openFile}
              />
            )
          )
        )}
      </div>
    );
  };

  // Debug log expanded folders
  useEffect(() => {
    console.log('Expanded folders:', Array.from(expandedFolders));
  }, [expandedFolders]);

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

// FolderItem component - represents a single folder in the tree
const FolderItem = ({ folder, expandedFolders, toggleFolder, openFile }) => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isExpanded = expandedFolders.has(folder.path);
  
  // Load children when folder is expanded
  useEffect(() => {
    const loadChildren = async () => {
      if (isExpanded && children.length === 0 && !loading) {
        setLoading(true);
        try {
          console.log(`Loading contents of folder: ${folder.path}`);
          const result = await window.electronAPI.getDirectoryContents(folder.path);
          if (result.error) {
            throw new Error(result.error);
          }
          
          // Sort items (directories first, then alphabetically)
          const sortedItems = sortItems(result.contents || []);
          setChildren(sortedItems);
          setError(null);
        } catch (err) {
          console.error(`Error loading folder ${folder.path}:`, err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadChildren();
  }, [folder.path, isExpanded, children.length, loading]);
  
  // Helper to sort items - directories first, then alphabetically
  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      // Directories first
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      
      // Then alphabetically
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  };
  
  // Handle click on this folder
  const handleClick = useCallback((e) => {
    e.stopPropagation(); // Prevent parent folders from toggling
    toggleFolder(folder.path);
  }, [folder.path, toggleFolder]);
  
  // Render folder content
  const renderFolderContent = () => {
    if (!isExpanded) return null;
    
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
        {children.map(item => 
          !shouldIgnoreFile(item.name) && (
            item.isDirectory ? (
              <FolderItem 
                key={item.path}
                folder={item}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                openFile={openFile}
              />
            ) : (
              <FileItem 
                key={item.path}
                file={item}
                openFile={openFile}
              />
            )
          )
        )}
      </div>
    );
  };
  
  return (
    <div className="folder-item">
      <div className="file-item-content" onClick={handleClick}>
        <span className={`folder-toggle ${isExpanded ? 'expanded' : ''}`}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 1L7 5L2 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <span className="file-item-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
        <span className="file-item-name">{folder.name}</span>
      </div>
      {renderFolderContent()}
    </div>
  );
};

// FileItem component - represents a single file in the tree
const FileItem = ({ file, openFile }) => {
  // Handle click on this file
  const handleClick = useCallback((e) => {
    e.stopPropagation(); // Prevent parent folders from toggling
    openFile(file.path);
  }, [file.path, openFile]);
  
  return (
    <div 
      className="file-item"
      onClick={handleClick}
    >
      <span className="file-item-icon">
        {getFileIcon(file.name)}
      </span>
      <span className="file-item-name">{file.name}</span>
    </div>
  );
};

// Helper functions

// Get file icon based on extension
const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  
  // Map extensions to modern SVG icons
  const iconMap = {
    // Documents
    'md': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7L12 12L17 7M7 12H17M7 17H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    'txt': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 8H17M7 12H17M7 16H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    
    // Images
    'jpg': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    'jpeg': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    'png': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    
    // PDFs
    'pdf': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 14.5V6.5M12 14.5V9.5M17 14.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    
    // Code
    'js': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 12H17.5M7 15.5V13.5M9.5 8.5V15.5C9.5 16.3284 8.82843 17 8 17V17C7.17157 17 6.5 16.3284 6.5 15.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    'jsx': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 12H17.5M7 15.5V13.5M9.5 8.5V15.5C9.5 16.3284 8.82843 17 8 17V17C7.17157 17 6.5 16.3284 6.5 15.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    'html': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 9L5 12L8 15M16 9L19 12L16 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    'css': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7H17L16 13H8L7 7Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 13L6 19H18L17 13" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    
    // Default
    'default': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
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

export default FileTree; 