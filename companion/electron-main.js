const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');

// Enable live reload for development
try {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit',
        forceHardReset: false
    });
    console.log('🔄 Live reload enabled');
} catch (e) {
    console.log('Live reload not available (install with: npm install electron-reload --save-dev)');
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 350,             // Compact size for character only
        height: 450,
        frame: false,           // Frameless window
        transparent: true,      // Transparent background
        alwaysOnTop: true,      // Always on top of other windows
        hasShadow: false,       // No window shadow
        resizable: false,       // Fixed size
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,  // Keep animations running when not focused
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'icon.png'),
        title: 'My AI Companion'
    });
    
    // Handle window dragging from renderer
    ipcMain.on('window-drag', (event, { deltaX, deltaY }) => {
        const [x, y] = mainWindow.getPosition();
        mainWindow.setPosition(x + deltaX, y + deltaY);
    });
    
    // Handle window resize for panel toggle
    ipcMain.on('window-resize', (event, { width, height }) => {
        mainWindow.setSize(width, height, true); // true = animate
    });

    // Load the index.html file
    mainWindow.loadFile('index.html');

    // Register F1 to toggle UI panel
    globalShortcut.register('F1', () => {
        mainWindow.webContents.executeJavaScript('toggleUIPanel()');
    });

    // Register Escape to quit
    globalShortcut.register('Escape', () => {
        app.quit();
    });

    // Open DevTools in development (comment out for production)
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Unregister shortcuts when quitting
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

