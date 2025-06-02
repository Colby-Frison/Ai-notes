/**
 * File Tree Manager - DEPRECATED
 * 
 * THIS FILE IS DEPRECATED AND REPLACED BY THE REACT COMPONENT: 
 * src/renderer/react/components/sidebar/FileTree.jsx
 * 
 * This stub implementation prevents errors but doesn't actually do anything,
 * allowing the React component to take over.
 */

export class FileTreeManager {
  constructor() {
    console.warn('FileTreeManager (JS version) is deprecated and replaced by React components.');
    // Don't access DOM elements to avoid conflicts with React
    this.rootDirectory = '';
    this.expandedFolders = new Set();
  }
  
  async loadExpandedFolders() { 
    console.warn('Using deprecated FileTreeManager.loadExpandedFolders()');
  }
  
  async saveExpandedFolders() { 
    console.warn('Using deprecated FileTreeManager.saveExpandedFolders()');
  }
  
  async loadDirectory(directoryPath) {
    console.warn('Using deprecated FileTreeManager.loadDirectory()');
    this.rootDirectory = directoryPath;
    // Do nothing else - let React handle it
  }
  
  async renderDirectory() {
    console.warn('Using deprecated FileTreeManager.renderDirectory()');
    // Do nothing - React handles rendering
  }
  
  setupEventListeners() {
    console.warn('Using deprecated FileTreeManager.setupEventListeners()');
    // Do nothing - React handles events
  }
  
  async handleFolderToggle() {
    console.warn('Using deprecated FileTreeManager.handleFolderToggle()');
  }
  
  async handleFileClick() {
    console.warn('Using deprecated FileTreeManager.handleFileClick()');
  }
  
  async handleFolderClick() {
    console.warn('Using deprecated FileTreeManager.handleFolderClick()');
  }
  
  getFileIcon() {
    console.warn('Using deprecated FileTreeManager.getFileIcon()');
    return '📄';
  }
  
  shouldIgnoreFile() {
    console.warn('Using deprecated FileTreeManager.shouldIgnoreFile()');
    return false;
  }
  
  async refreshFileTree() {
    console.warn('Using deprecated FileTreeManager.refreshFileTree()');
  }
} 