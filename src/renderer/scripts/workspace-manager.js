/**
 * Workspace Manager
 * 
 * Handles the workspace area, including file opening, tabs management,
 * and file content rendering.
 */

export class WorkspaceManager {
  constructor() {
    this.tabsBar = document.getElementById('tabs-bar');
    this.contentArea = document.getElementById('content-area');
    this.openFiles = [];
    this.activeFile = null;
    
    this.loadOpenFiles();
    this.setupEventListeners();
  }
  
  /**
   * Load previously open files from config
   */
  async loadOpenFiles() {
    try {
      const savedOpenFiles = await window.electronAPI.getConfig('openFiles');
      
      if (savedOpenFiles && Array.isArray(savedOpenFiles) && savedOpenFiles.length > 0) {
        // Open each file that was previously open
        for (const filePath of savedOpenFiles) {
          await this.openFile(filePath, false); // Don't activate each file
        }
        
        // Activate the last active file
        const lastActiveFile = await window.electronAPI.getConfig('activeFile');
        if (lastActiveFile && this.openFiles.some(file => file.path === lastActiveFile)) {
          await this.activateFile(lastActiveFile);
        } else if (this.openFiles.length > 0) {
          // If last active file doesn't exist, activate the first open file
          await this.activateFile(this.openFiles[0].path);
        }
      }
    } catch (error) {
      console.error('Error loading open files:', error);
    }
  }
  
  /**
   * Save open files to config
   */
  async saveOpenFiles() {
    try {
      const openFilePaths = this.openFiles.map(file => file.path);
      await window.electronAPI.setConfig('openFiles', openFilePaths);
      
      if (this.activeFile) {
        await window.electronAPI.setConfig('activeFile', this.activeFile);
      }
    } catch (error) {
      console.error('Error saving open files:', error);
    }
  }
  
  /**
   * Open a file in the workspace
   * @param {string} filePath - Path to the file to open
   * @param {boolean} [activate=true] - Whether to activate the file after opening
   */
  async openFile(filePath, activate = true) {
    try {
      // Check if file is already open
      if (this.openFiles.some(file => file.path === filePath)) {
        if (activate) {
          await this.activateFile(filePath);
        }
        return;
      }
      
      // Get file content from main process
      const result = await window.electronAPI.readFile(filePath);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Get file name from path
      const fileName = filePath.split(/[/\\]/).pop();
      
      // Create file object
      const fileObject = {
        path: filePath,
        name: fileName,
        content: result.content,
        modified: false
      };
      
      // Add to open files array
      this.openFiles.push(fileObject);
      
      // Create tab
      this.createTab(fileObject);
      
      // Create content element
      this.createContentElement(fileObject);
      
      // Activate the file if requested
      if (activate) {
        await this.activateFile(filePath);
      }
      
      // Save open files to config
      await this.saveOpenFiles();
      
    } catch (error) {
      console.error('Error opening file:', error);
      alert(`Error opening file: ${error.message}`);
    }
  }
  
  /**
   * Create a tab for a file
   * @param {Object} fileObject - The file object
   */
  createTab(fileObject) {
    // Remove placeholder if present
    const placeholder = this.tabsBar.querySelector('.tab-placeholder');
    if (placeholder) {
      placeholder.remove();
    }
    
    // Create tab element
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.setAttribute('data-path', fileObject.path);
    
    // Create tab content
    let tabContent = '';
    
    // Add unsaved indicator if file is modified
    if (fileObject.modified) {
      tabContent += '<span class="tab-unsaved"></span>';
    }
    
    // Add file name
    tabContent += `<span class="tab-title">${fileObject.name}</span>`;
    
    // Add close button
    tabContent += '<button class="tab-close" aria-label="Close tab">×</button>';
    
    tab.innerHTML = tabContent;
    
    // Add tab to tabs bar
    this.tabsBar.appendChild(tab);
  }
  
  /**
   * Create a content element for a file
   * @param {Object} fileObject - The file object
   */
  createContentElement(fileObject) {
    // Create content element
    const contentElement = document.createElement('div');
    contentElement.className = 'file-content';
    contentElement.setAttribute('data-path', fileObject.path);
    
    // Determine file type and create appropriate content
    const fileExtension = fileObject.name.split('.').pop().toLowerCase();
    
    if (['md', 'markdown'].includes(fileExtension)) {
      // Markdown file - will implement markdown editor later
      contentElement.innerHTML = this.createMarkdownEditor(fileObject);
    } else if (['txt', 'text', 'log'].includes(fileExtension)) {
      // Text file - simple editor
      contentElement.innerHTML = this.createTextEditor(fileObject);
    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(fileExtension)) {
      // Image file
      contentElement.innerHTML = this.createImageViewer(fileObject);
    } else if (fileExtension === 'pdf') {
      // PDF file - will implement PDF viewer later
      contentElement.innerHTML = `
        <div class="empty-state">
          <p>PDF viewing not yet implemented</p>
          <p>File: ${fileObject.name}</p>
        </div>
      `;
    } else {
      // Default to text editor for now
      contentElement.innerHTML = this.createTextEditor(fileObject);
    }
    
    // Add content element to content area
    this.contentArea.appendChild(contentElement);
  }
  
  /**
   * Create a text editor for a file
   * @param {Object} fileObject - The file object
   * @returns {string} HTML for the text editor
   */
  createTextEditor(fileObject) {
    return `
      <textarea class="editor-textarea" data-path="${fileObject.path}">${fileObject.content}</textarea>
    `;
  }
  
  /**
   * Create a markdown editor for a file
   * @param {Object} fileObject - The file object
   * @returns {string} HTML for the markdown editor
   */
  createMarkdownEditor(fileObject) {
    return `
      <div class="editor-container" data-path="${fileObject.path}">
        <div class="editor-toolbar">
          <button class="editor-mode-btn active" data-mode="edit">Edit</button>
          <button class="editor-mode-btn" data-mode="preview">Preview</button>
          <button class="editor-mode-btn" data-mode="split">Split</button>
        </div>
        <div class="editor-content">
          <div class="editor-mode edit-mode active">
            <textarea class="editor-textarea" data-path="${fileObject.path}">${fileObject.content}</textarea>
          </div>
          <div class="editor-mode preview-mode">
            <div class="markdown-content">
              <!-- Markdown preview will be rendered here -->
              <p>Preview not yet implemented</p>
            </div>
          </div>
          <div class="editor-mode split-mode">
            <div class="split-editor">
              <textarea class="editor-textarea" data-path="${fileObject.path}">${fileObject.content}</textarea>
            </div>
            <div class="split-preview">
              <div class="markdown-content">
                <!-- Markdown preview will be rendered here -->
                <p>Preview not yet implemented</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Create an image viewer for a file
   * @param {Object} fileObject - The file object
   * @returns {string} HTML for the image viewer
   */
  createImageViewer(fileObject) {
    return `
      <div class="image-container" data-path="${fileObject.path}">
        <div class="image-toolbar">
          <div class="image-controls">
            <button class="image-zoom-out">-</button>
            <button class="image-zoom-reset">100%</button>
            <button class="image-zoom-in">+</button>
            <button class="image-fit">Fit</button>
          </div>
          <div class="image-info">
            ${fileObject.name}
          </div>
        </div>
        <div class="image-viewer">
          <img src="file://${fileObject.path}" class="image-content" alt="${fileObject.name}">
        </div>
      </div>
    `;
  }
  
  /**
   * Activate a file in the workspace
   * @param {string} filePath - Path to the file to activate
   */
  async activateFile(filePath) {
    // Update active file
    this.activeFile = filePath;
    
    // Update tabs
    const tabs = this.tabsBar.querySelectorAll('.tab');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-path') === filePath) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update content
    const contents = this.contentArea.querySelectorAll('.file-content');
    contents.forEach(content => {
      if (content.getAttribute('data-path') === filePath) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
    
    // Save active file to config
    await window.electronAPI.setConfig('activeFile', filePath);
    
    // Hide empty workspace if we have an active file
    const emptyWorkspace = this.contentArea.querySelector('.empty-workspace');
    if (emptyWorkspace) {
      emptyWorkspace.style.display = 'none';
    }
  }
  
  /**
   * Close a file in the workspace
   * @param {string} filePath - Path to the file to close
   */
  async closeFile(filePath) {
    // Check if file is modified and prompt to save
    const fileObject = this.openFiles.find(file => file.path === filePath);
    if (fileObject && fileObject.modified) {
      // In a real app, we would prompt to save here
      // For now, we just close the file without saving
    }
    
    // Remove from open files array
    this.openFiles = this.openFiles.filter(file => file.path !== filePath);
    
    // Remove tab
    const tab = this.tabsBar.querySelector(`.tab[data-path="${filePath}"]`);
    if (tab) {
      tab.remove();
    }
    
    // Remove content
    const content = this.contentArea.querySelector(`.file-content[data-path="${filePath}"]`);
    if (content) {
      content.remove();
    }
    
    // If closed file was active, activate another file
    if (this.activeFile === filePath) {
      if (this.openFiles.length > 0) {
        // Activate the first open file
        await this.activateFile(this.openFiles[0].path);
      } else {
        // No files open, show empty workspace
        this.activeFile = null;
        
        // Add tab placeholder
        this.tabsBar.innerHTML = '<div class="tab-placeholder">No files open</div>';
        
        // Show empty workspace
        const emptyWorkspace = this.contentArea.querySelector('.empty-workspace');
        if (emptyWorkspace) {
          emptyWorkspace.style.display = 'flex';
        }
      }
    }
    
    // Save open files to config
    await this.saveOpenFiles();
  }
  
  /**
   * Set up event listeners for the workspace
   */
  setupEventListeners() {
    // Use event delegation for tab clicks
    this.tabsBar.addEventListener('click', event => {
      // Handle close button clicks
      if (event.target.classList.contains('tab-close')) {
        const tab = event.target.closest('.tab');
        if (tab) {
          const filePath = tab.getAttribute('data-path');
          this.closeFile(filePath);
        }
        return;
      }
      
      // Handle tab clicks
      const tab = event.target.closest('.tab');
      if (tab) {
        const filePath = tab.getAttribute('data-path');
        this.activateFile(filePath);
      }
    });
    
    // Use event delegation for content area events
    this.contentArea.addEventListener('input', event => {
      // Handle text editor input
      if (event.target.classList.contains('editor-textarea')) {
        const filePath = event.target.getAttribute('data-path');
        const fileObject = this.openFiles.find(file => file.path === filePath);
        
        if (fileObject) {
          // Update file content
          fileObject.content = event.target.value;
          
          // Mark as modified if not already
          if (!fileObject.modified) {
            fileObject.modified = true;
            
            // Update tab to show unsaved indicator
            const tab = this.tabsBar.querySelector(`.tab[data-path="${filePath}"]`);
            if (tab) {
              const tabTitle = tab.querySelector('.tab-title');
              if (tabTitle && !tab.querySelector('.tab-unsaved')) {
                const unsavedIndicator = document.createElement('span');
                unsavedIndicator.className = 'tab-unsaved';
                tab.insertBefore(unsavedIndicator, tabTitle);
              }
            }
          }
        }
      }
    });
    
    // Handle markdown editor toolbar button clicks
    this.contentArea.addEventListener('click', event => {
      if (event.target.classList.contains('editor-mode-btn')) {
        const mode = event.target.getAttribute('data-mode');
        const editorContainer = event.target.closest('.editor-container');
        
        if (editorContainer) {
          // Update toolbar buttons
          const buttons = editorContainer.querySelectorAll('.editor-mode-btn');
          buttons.forEach(button => {
            if (button === event.target) {
              button.classList.add('active');
            } else {
              button.classList.remove('active');
            }
          });
          
          // Update editor modes
          const modes = editorContainer.querySelectorAll('.editor-mode');
          modes.forEach(modeElement => {
            if (modeElement.classList.contains(`${mode}-mode`)) {
              modeElement.classList.add('active');
            } else {
              modeElement.classList.remove('active');
            }
          });
        }
      }
    });
  }
} 