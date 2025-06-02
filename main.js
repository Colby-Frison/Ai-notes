const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const url = require('url');
const Store = require('electron-store');
const { startServer, stopServer } = require('./src/backend/server');

// Initialize config store
const store = new Store({
  name: '.notes-config',
  encryptionKey: 'ai-notes-encryption-key',
  fileExtension: 'json'
});

// Keep a global reference of the window object to prevent garbage collection
let mainWindow = null;
let isDevMode = process.argv.includes('--dev');

// Configure CSP
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self' http://localhost:* ws://localhost:*"
].join('; ');

async function createWindow() {
  const { width, height } = store.get('windowBounds', { width: 1200, height: 800 });
  
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: true
    },
    frame: true,
    autoHideMenuBar: false,
    show: false
  });

  // Set CSP headers
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [CSP]
      }
    });
  });

  // Load the index.html from the renderer directory
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'src/renderer/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Add this code to enable React DevTools if in development mode
  if (isDevMode) {
    try {
      const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
      installExtension(REACT_DEVELOPER_TOOLS)
        .then((name) => console.log(`Added Extension: ${name}`))
        .catch((err) => console.log('An error occurred: ', err));
    } catch (e) {
      console.error('React DevTools failed to install:', e);
    }
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDevMode) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Save window dimensions when resizing
  mainWindow.on('resize', () => {
    const { width, height } = mainWindow.getBounds();
    store.set('windowBounds', { width, height });
  });

  // Clean up the window object when closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when Electron is ready
app.whenReady().then(async () => {
  // Start backend server
  try {
    const port = await startServer();
    console.log(`Backend server started on port ${port}`);
  } catch (error) {
    console.error('Failed to start backend server:', error);
  }
  
  await createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (mainWindow === null) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup when app is about to quit
app.on('will-quit', async (event) => {
  // Stop the backend server gracefully
  try {
    event.preventDefault(); // Prevent immediate quit to allow async cleanup
    await stopServer();
    console.log('Backend server stopped');
    app.exit(0); // Now exit the app
  } catch (error) {
    console.error('Error stopping backend server:', error);
    app.exit(1); // Exit with error code
  }
});

// IPC Channel Handlers
// File System Operations
ipcMain.handle('dialog:openDirectory', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Notes Directory',
      buttonLabel: 'Select Folder'
    });
    
    if (canceled) {
      return { canceled: true };
    }
    
    // Verify read/write access
    try {
      const testFile = path.join(filePaths[0], '.notes-test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
    } catch (error) {
      return {
        error: 'Permission Error',
        message: 'Unable to write to the selected directory. Please choose a directory with write permissions.'
      };
    }
    
    // Save root directory in config
    store.set('rootDirectory', filePaths[0]);
    
    return {
      canceled: false,
      directory: filePaths[0]
    };
  } catch (error) {
    console.error('Error selecting directory:', error);
    return {
      error: 'Selection Error',
      message: 'An error occurred while selecting the directory.'
    };
  }
});

// Directory contents
ipcMain.handle('fs:getDirectoryContents', async (event, directoryPath) => {
  try {
    // Security check - validate the path is within the root directory
    const rootDir = store.get('rootDirectory');
    if (!rootDir) {
      return { error: 'No root directory set' };
    }
    
    // Normalize paths for comparison
    const normalizedRequestedPath = path.normalize(directoryPath);
    const normalizedRootPath = path.normalize(rootDir);
    
    // Check if requested path is within root directory
    if (!normalizedRequestedPath.startsWith(normalizedRootPath)) {
      return { error: 'Path traversal attempt detected' };
    }
    
    const files = await fs.readdir(directoryPath, { withFileTypes: true });
    const contents = await Promise.all(files.map(async (dirent) => {
      const filePath = path.join(directoryPath, dirent.name);
      const stats = await fs.stat(filePath);
      
      return {
        name: dirent.name,
        path: filePath,
        isDirectory: dirent.isDirectory(),
        size: stats.size,
        lastModified: stats.mtime.toISOString()
      };
    }));
    
    // Sort by directories first, then alphabetically
    contents.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
    
    return { contents };
  } catch (error) {
    console.error('Error reading directory:', error);
    return { error: error.message };
  }
});

// File operations
ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    // Security check - validate the path is within the root directory
    const rootDir = store.get('rootDirectory');
    if (!rootDir) {
      return { error: 'No root directory set' };
    }
    
    // Normalize paths for comparison
    const normalizedFilePath = path.normalize(filePath);
    const normalizedRootPath = path.normalize(rootDir);
    
    // Check if requested path is within root directory
    if (!normalizedFilePath.startsWith(normalizedRootPath)) {
      return { error: 'Path traversal attempt detected' };
    }
    
    // Check if file exists
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return { error: 'Not a file' };
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        return { error: 'File does not exist' };
      }
      throw err; // Re-throw other errors
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    return { content };
  } catch (error) {
    console.error('Error reading file:', error);
    return { error: error.message };
  }
});

// Save file
ipcMain.handle('fs:saveFile', async (event, filePath, content) => {
  try {
    // Security check - validate the path is within the root directory
    const rootDir = store.get('rootDirectory');
    if (!rootDir) {
      return { error: 'No root directory set' };
    }
    
    // Normalize paths for comparison
    const normalizedFilePath = path.normalize(filePath);
    const normalizedRootPath = path.normalize(rootDir);
    
    // Check if requested path is within root directory
    if (!normalizedFilePath.startsWith(normalizedRootPath)) {
      return { error: 'Path traversal attempt detected' };
    }
    
    // Ensure the directory exists
    const fileDir = path.dirname(filePath);
    try {
      await fs.mkdir(fileDir, { recursive: true });
    } catch (err) {
      // Ignore error if directory already exists
      if (err.code !== 'EEXIST') throw err;
    }
    
    // Write content to file
    await fs.writeFile(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error saving file:', error);
    return { error: error.message };
  }
});

// Config Management
ipcMain.handle('config:get', (event, key) => {
  try {
    return store.get(key);
  } catch (error) {
    console.error(`Error getting config value for key "${key}":`, error);
    return null;
  }
});

ipcMain.handle('config:set', (event, key, value) => {
  try {
    store.set(key, value);
    return { success: true };
  } catch (error) {
    console.error(`Error setting config value for key "${key}":`, error);
    return { error: error.message };
  }
});

// UI Helpers
ipcMain.handle('window:toggleSidebar', () => {
  // This can be implemented later if needed
  return true;
}); 