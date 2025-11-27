const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    dragWindow: (deltaX, deltaY) => {
        ipcRenderer.send('window-drag', { deltaX, deltaY });
    },
    resizeWindow: (width, height) => {
        ipcRenderer.send('window-resize', { width, height });
    }
});

