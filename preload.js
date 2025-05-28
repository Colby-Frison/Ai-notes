const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File System Operations
  openDirectory: async () => {
    return await ipcRenderer.invoke('dialog:openDirectory');
  },
  getDirectoryContents: async (directoryPath) => {
    return await ipcRenderer.invoke('fs:getDirectoryContents', directoryPath);
  },
  readFile: async (filePath) => {
    return await ipcRenderer.invoke('fs:readFile', filePath);
  },
  saveFile: async (filePath, content) => {
    return await ipcRenderer.invoke('fs:saveFile', filePath, content);
  },
  
  // Config Management
  getConfig: async (key) => {
    return await ipcRenderer.invoke('config:get', key);
  },
  setConfig: async (key, value) => {
    return await ipcRenderer.invoke('config:set', key, value);
  },
  
  // UI Helpers
  toggleSidebar: async () => {
    return await ipcRenderer.invoke('window:toggleSidebar');
  }
});

// Expose versions information to renderer
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
}); 