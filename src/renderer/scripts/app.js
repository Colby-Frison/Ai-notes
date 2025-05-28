/**
 * AI Notes - Main Application Script
 * 
 * This is the entry point for the renderer process, handling UI interactions,
 * file operations, and sidebar functionality.
 */

// Import modules
import { FileTreeManager } from './file-tree.js';
import { WorkspaceManager } from './workspace-manager.js';
import { SettingsManager } from './settings-manager.js';
import { ThemeManager } from './theme-manager.js';
import { ChatManager } from './chat-manager.js';

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize managers
  const fileTreeManager = new FileTreeManager();
  const workspaceManager = new WorkspaceManager();
  const settingsManager = new SettingsManager();
  const themeManager = new ThemeManager();
  const chatManager = new ChatManager();
  
  // Set up sidebar interactions
  setupSidebar();
  
  // Load settings and apply theme
  await settingsManager.loadSettings();
  themeManager.applyTheme(await window.electronAPI.getConfig('theme') || 'system');
  
  // Check for root directory and initialize file tree
  initializeFileTree();
  
  // Set up event listeners for various UI elements
  setupEventListeners();
  
  // Log initialization complete
  console.log('Application initialized successfully');
});

/**
 * Set up sidebar toggle and navigation
 */
function setupSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarButtons = document.querySelectorAll('.sidebar-btn');
  const sidebarPanels = document.querySelectorAll('.sidebar-panel');
  
  // Toggle sidebar collapsed state
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    window.electronAPI.setConfig('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    
    // Force resize event to update layout
    window.dispatchEvent(new Event('resize'));
  });
  
  // Apply saved sidebar state
  window.electronAPI.getConfig('sidebarCollapsed').then(collapsed => {
    if (collapsed) {
      sidebar.classList.add('collapsed');
    } else {
      sidebar.classList.remove('collapsed');
    }
    
    // Force resize event to update layout
    window.dispatchEvent(new Event('resize'));
  });
  
  // Switch between sidebar panels
  sidebarButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Get the target panel from data attribute
      const targetPanelId = button.getAttribute('data-panel');
      const targetPanel = document.getElementById(targetPanelId);
      
      console.log('Clicked sidebar button:', targetPanelId);
      
      if (!targetPanel) {
        console.error('Target panel not found:', targetPanelId);
        return;
      }
      
      // Remove active class from all buttons and panels
      sidebarButtons.forEach(btn => btn.classList.remove('active'));
      sidebarPanels.forEach(panel => panel.classList.remove('active'));
      
      // Add active class to the clicked button and target panel
      button.classList.add('active');
      targetPanel.classList.add('active');
      
      // Save active panel to config
      window.electronAPI.setConfig('activeSidebarPanel', targetPanelId);
    });
  });
  
  // Restore last active panel
  window.electronAPI.getConfig('activeSidebarPanel').then(activePanelId => {
    if (activePanelId) {
      const activeButton = document.querySelector(`.sidebar-btn[data-panel="${activePanelId}"]`);
      if (activeButton) {
        console.log('Restoring active panel:', activePanelId);
        activeButton.click();
      }
    }
  });
}

/**
 * Initialize file tree with the saved root directory
 */
async function initializeFileTree() {
  const rootDir = await window.electronAPI.getConfig('rootDirectory');
  
  if (rootDir) {
    try {
      const fileTreeManager = new FileTreeManager();
      await fileTreeManager.loadDirectory(rootDir);
    } catch (error) {
      console.error('Error loading root directory:', error);
      showErrorMessage('Could not load the saved directory. Please select a new one.');
    }
  } else {
    // No root directory set, show empty state
    const fileTree = document.getElementById('file-tree');
    fileTree.innerHTML = `
      <div class="empty-state">
        <p>No folder selected</p>
        <p>Click 'Select Folder' to choose a root directory</p>
      </div>
    `;
  }
  
  // Set up select directory buttons
  const selectRootDirButtons = document.querySelectorAll('#select-root-dir, #welcome-select-dir');
  selectRootDirButtons.forEach(button => {
    button.addEventListener('click', async () => {
      try {
        const result = await window.electronAPI.openDirectory();
        
        if (!result.canceled && result.directory) {
          const fileTreeManager = new FileTreeManager();
          await fileTreeManager.loadDirectory(result.directory);
        } else if (result.error) {
          showErrorMessage(result.message || 'Error selecting directory');
        }
      } catch (error) {
        console.error('Error selecting directory:', error);
        showErrorMessage('An error occurred while selecting a directory');
      }
    });
  });
}

/**
 * Set up all event listeners for the application
 */
function setupEventListeners() {
  // Settings modal
  setupSettingsModal();
  
  // AI Chat
  setupChatInterface();
}

/**
 * Set up the settings modal
 */
function setupSettingsModal() {
  const settingsBtn = document.getElementById('open-settings-modal');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettings = document.getElementById('close-settings');
  const saveSettings = document.getElementById('settings-save');
  const applySettings = document.getElementById('settings-apply');
  const cancelSettings = document.getElementById('settings-cancel');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  // Open settings modal
  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
    
    // Load current settings
    const settingsManager = new SettingsManager();
    settingsManager.populateSettingsForm();
  });
  
  // Close settings modal
  const closeModal = () => {
    settingsModal.classList.remove('active');
  };
  
  closeSettings.addEventListener('click', closeModal);
  cancelSettings.addEventListener('click', closeModal);
  
  // Save settings
  saveSettings.addEventListener('click', () => {
    const settingsManager = new SettingsManager();
    settingsManager.saveSettings();
    closeModal();
  });
  
  // Apply settings without closing
  applySettings.addEventListener('click', () => {
    const settingsManager = new SettingsManager();
    settingsManager.saveSettings();
  });
  
  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-tab');
      
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // Add active class to clicked button and target pane
      button.classList.add('active');
      document.getElementById(`${target}-settings`).classList.add('active');
    });
  });
  
  // Close modal when clicking outside
  settingsModal.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
      closeModal();
    }
  });
  
  // Prevent propagation from modal content
  const modalContent = settingsModal.querySelector('.modal-content');
  modalContent.addEventListener('click', (event) => {
    event.stopPropagation();
  });
}

/**
 * Set up the AI chat interface
 */
function setupChatInterface() {
  const sendButton = document.getElementById('send-message');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const clearChatButton = document.getElementById('clear-chat');
  
  // Send message when button is clicked
  sendButton.addEventListener('click', () => {
    sendChatMessage();
  });
  
  // Send message when Enter key is pressed (but not with Shift)
  chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendChatMessage();
    }
  });
  
  // Clear chat history
  clearChatButton.addEventListener('click', () => {
    const chatManager = new ChatManager();
    chatManager.clearChatHistory();
    
    // Clear UI
    chatMessages.innerHTML = `
      <div class="empty-state">
        <p>Chat cleared</p>
        <p>Start a new conversation</p>
      </div>
    `;
  });
  
  /**
   * Send a chat message to the AI
   */
  function sendChatMessage() {
    const message = chatInput.value.trim();
    
    if (message) {
      const chatManager = new ChatManager();
      chatManager.sendMessage(message);
      
      // Clear input
      chatInput.value = '';
    }
  }
}

/**
 * Show an error message to the user
 * @param {string} message - The error message to display
 */
function showErrorMessage(message) {
  // For now, just using console.error
  // In the future, implement a proper toast/notification system
  console.error(message);
  alert(message); // Temporary solution
} 