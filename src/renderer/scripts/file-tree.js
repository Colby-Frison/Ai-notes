/**
 * File Tree Manager
 * 
 * Handles rendering and interacting with the file tree in the sidebar.
 * Includes folder expansion/collapse and file selection.
 */

export class FileTreeManager {
  constructor() {
    this.fileTreeElement = document.getElementById('file-tree');
    this.workspaceManager = null; // Will be imported dynamically to avoid circular dependencies
    this.rootDirectory = '';
    this.expandedFolders = new Set();
    
    // Load expanded folders from config
    this.loadExpandedFolders();
  }
  
  /**
   * Load the expanded folders state from the config
   */
  async loadExpandedFolders() {
    try {
      const savedExpandedFolders = await window.electronAPI.getConfig('expandedFolders');
      if (savedExpandedFolders && Array.isArray(savedExpandedFolders)) {
        this.expandedFolders = new Set(savedExpandedFolders);
      }
    } catch (error) {
      console.error('Error loading expanded folders:', error);
    }
  }
  
  /**
   * Save the current expanded folders state to the config
   */
  async saveExpandedFolders() {
    try {
      await window.electronAPI.setConfig('expandedFolders', Array.from(this.expandedFolders));
    } catch (error) {
      console.error('Error saving expanded folders:', error);
    }
  }
  
  /**
   * Load a directory into the file tree
   * @param {string} directoryPath - The path to the root directory
   */
  async loadDirectory(directoryPath) {
    try {
      this.rootDirectory = directoryPath;
      await window.electronAPI.setConfig('rootDirectory', directoryPath);
      
      // Clear the file tree
      this.fileTreeElement.innerHTML = '';
      
      // Show loading indicator
      this.fileTreeElement.innerHTML = '<div class="loading">Loading...</div>';
      
      // Get directory contents from the main process
      const result = await window.electronAPI.getDirectoryContents(directoryPath);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Clear loading indicator
      this.fileTreeElement.innerHTML = '';
      
      // Render the file tree
      await this.renderDirectory(result.contents, this.fileTreeElement, directoryPath);
      
      // Dynamically import WorkspaceManager to avoid circular dependencies
      const { WorkspaceManager } = await import('./workspace-manager.js');
      this.workspaceManager = new WorkspaceManager();
      
      // Set up event listeners
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Error loading directory:', error);
      this.fileTreeElement.innerHTML = `
        <div class="error-state">
          <p>Error loading directory</p>
          <p>${error.message}</p>
        </div>
      `;
    }
  }
  
  /**
   * Render directory contents as a file tree
   * @param {Array} contents - Array of file and folder objects
   * @param {HTMLElement} parentElement - Element to append the file tree to
   * @param {string} parentPath - Path of the parent directory
   */
  async renderDirectory(contents, parentElement, parentPath) {
    // Check if we have contents
    if (!contents || contents.length === 0) {
      parentElement.innerHTML += `
        <div class="empty-folder">
          <p>Empty folder</p>
        </div>
      `;
      return;
    }
    
    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Process each file/folder
    for (const item of contents) {
      // Skip ignored files/folders
      if (this.shouldIgnoreFile(item.name)) {
        continue;
      }
      
      const itemElement = document.createElement('div');
      itemElement.className = item.isDirectory ? 'folder-item' : 'file-item';
      itemElement.setAttribute('data-path', item.path);
      
      // Create item content
      const itemContent = document.createElement('div');
      itemContent.className = 'file-item-content';
      
      // Add icon and name
      if (item.isDirectory) {
        const isExpanded = this.expandedFolders.has(item.path);
        
        // Folder toggle icon
        const toggleIcon = document.createElement('span');
        toggleIcon.className = `folder-toggle ${isExpanded ? 'expanded' : ''}`;
        toggleIcon.innerHTML = '▶';
        itemContent.appendChild(toggleIcon);
        
        // Folder icon
        const folderIcon = document.createElement('span');
        folderIcon.className = 'file-item-icon';
        folderIcon.innerHTML = '📁';
        itemContent.appendChild(folderIcon);
        
      } else {
        // File icon based on extension
        const fileIcon = document.createElement('span');
        fileIcon.className = 'file-item-icon';
        fileIcon.innerHTML = this.getFileIcon(item.name);
        itemContent.appendChild(fileIcon);
      }
      
      // File/folder name
      const nameSpan = document.createElement('span');
      nameSpan.className = 'file-item-name';
      nameSpan.textContent = item.name;
      itemContent.appendChild(nameSpan);
      
      itemElement.appendChild(itemContent);
      
      // If it's a folder and it's expanded, load its contents
      if (item.isDirectory && this.expandedFolders.has(item.path)) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'folder-children';
        
        // Add loading indicator
        childrenContainer.innerHTML = '<div class="loading">Loading...</div>';
        
        itemElement.appendChild(childrenContainer);
        
        // Fetch folder contents
        try {
          const childResult = await window.electronAPI.getDirectoryContents(item.path);
          
          if (childResult.error) {
            childrenContainer.innerHTML = `<div class="error">Error: ${childResult.error}</div>`;
          } else {
            // Clear loading indicator
            childrenContainer.innerHTML = '';
            
            // Render children
            await this.renderDirectory(childResult.contents, childrenContainer, item.path);
          }
        } catch (error) {
          console.error(`Error loading folder ${item.path}:`, error);
          childrenContainer.innerHTML = `<div class="error">Error loading folder</div>`;
        }
      }
      
      fragment.appendChild(itemElement);
    }
    
    // Append the fragment to the parent element
    parentElement.appendChild(fragment);
  }
  
  /**
   * Set up event listeners for the file tree
   */
  setupEventListeners() {
    // Use event delegation for better performance
    this.fileTreeElement.addEventListener('click', async (event) => {
      // Handle folder toggle clicks
      if (event.target.classList.contains('folder-toggle')) {
        await this.handleFolderToggle(event);
        return;
      }
      
      // Find the closest file or folder item
      const fileItem = event.target.closest('.file-item');
      const folderItem = event.target.closest('.folder-item');
      
      if (fileItem) {
        // Handle file click
        await this.handleFileClick(fileItem);
      } else if (folderItem) {
        // Only handle folder clicks if they're not on the toggle
        if (!event.target.classList.contains('folder-toggle')) {
          await this.handleFolderClick(folderItem);
        }
      }
    });
  }
  
  /**
   * Handle clicking on a folder toggle icon
   * @param {Event} event - The click event
   */
  async handleFolderToggle(event) {
    const toggleIcon = event.target;
    const folderItem = toggleIcon.closest('.folder-item');
    const folderPath = folderItem.getAttribute('data-path');
    
    // Toggle expanded state
    toggleIcon.classList.toggle('expanded');
    
    if (toggleIcon.classList.contains('expanded')) {
      // Expand folder
      this.expandedFolders.add(folderPath);
      
      // Check if children container already exists
      let childrenContainer = folderItem.querySelector('.folder-children');
      
      if (!childrenContainer) {
        // Create children container
        childrenContainer = document.createElement('div');
        childrenContainer.className = 'folder-children';
        folderItem.appendChild(childrenContainer);
      }
      
      // If container is empty or just has a loading indicator, load contents
      if (!childrenContainer.children.length || 
          (childrenContainer.children.length === 1 && childrenContainer.children[0].classList.contains('loading'))) {
        
        // Add loading indicator
        childrenContainer.innerHTML = '<div class="loading">Loading...</div>';
        
        try {
          // Get folder contents
          const result = await window.electronAPI.getDirectoryContents(folderPath);
          
          if (result.error) {
            childrenContainer.innerHTML = `<div class="error">Error: ${result.error}</div>`;
          } else {
            // Clear loading indicator
            childrenContainer.innerHTML = '';
            
            // Render children
            await this.renderDirectory(result.contents, childrenContainer, folderPath);
          }
        } catch (error) {
          console.error(`Error loading folder ${folderPath}:`, error);
          childrenContainer.innerHTML = `<div class="error">Error loading folder</div>`;
        }
      }
    } else {
      // Collapse folder
      this.expandedFolders.delete(folderPath);
      
      // Don't remove the children from DOM, just hide them
      // This way, we don't have to reload them when the folder is expanded again
      // We could optimize this further by removing them after a timeout
    }
    
    // Save expanded folders state
    await this.saveExpandedFolders();
  }
  
  /**
   * Handle clicking on a file
   * @param {HTMLElement} fileItem - The clicked file element
   */
  async handleFileClick(fileItem) {
    // Remove active class from all files
    this.fileTreeElement.querySelectorAll('.file-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to clicked file
    fileItem.classList.add('active');
    
    // Get file path and open it in the workspace
    const filePath = fileItem.getAttribute('data-path');
    
    if (this.workspaceManager) {
      await this.workspaceManager.openFile(filePath);
    } else {
      console.error('WorkspaceManager not initialized');
    }
  }
  
  /**
   * Handle clicking on a folder (not the toggle)
   * @param {HTMLElement} folderItem - The clicked folder element
   */
  async handleFolderClick(folderItem) {
    // Find the toggle and simulate a click on it
    const toggleIcon = folderItem.querySelector('.folder-toggle');
    if (toggleIcon) {
      toggleIcon.click();
    }
  }
  
  /**
   * Get an appropriate icon for a file based on its extension
   * @param {string} fileName - Name of the file
   * @returns {string} HTML string for the icon
   */
  getFileIcon(fileName) {
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
  }
  
  /**
   * Check if a file should be ignored in the file tree
   * @param {string} fileName - Name of the file
   * @returns {boolean} True if the file should be ignored
   */
  shouldIgnoreFile(fileName) {
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
  }
  
  /**
   * Refresh the file tree
   * @param {string} [directoryPath=null] - Optional specific directory to refresh, defaults to root directory
   */
  async refreshFileTree(directoryPath = null) {
    const pathToRefresh = directoryPath || this.rootDirectory;
    
    if (!pathToRefresh) {
      console.error('No directory to refresh');
      return;
    }
    
    // If refreshing the root, reload the entire tree
    if (pathToRefresh === this.rootDirectory) {
      await this.loadDirectory(pathToRefresh);
      return;
    }
    
    // Otherwise, find the specific folder element and refresh just that part
    const folderElement = this.fileTreeElement.querySelector(`.folder-item[data-path="${pathToRefresh}"]`);
    
    if (folderElement) {
      // Get the children container
      let childrenContainer = folderElement.querySelector('.folder-children');
      
      if (childrenContainer) {
        // Add loading indicator
        childrenContainer.innerHTML = '<div class="loading">Loading...</div>';
        
        try {
          // Get folder contents
          const result = await window.electronAPI.getDirectoryContents(pathToRefresh);
          
          if (result.error) {
            childrenContainer.innerHTML = `<div class="error">Error: ${result.error}</div>`;
          } else {
            // Clear loading indicator
            childrenContainer.innerHTML = '';
            
            // Render children
            await this.renderDirectory(result.contents, childrenContainer, pathToRefresh);
          }
        } catch (error) {
          console.error(`Error refreshing folder ${pathToRefresh}:`, error);
          childrenContainer.innerHTML = `<div class="error">Error refreshing folder</div>`;
        }
      }
    }
  }
} 