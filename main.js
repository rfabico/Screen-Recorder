const { app, BrowserWindow, ipcMain, Menu, MenuItem, dialog, desktopCapturer } = require('electron');
const path = require('path');

let mainWindow;

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width: 1000,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false,
      }
    });
  
    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  };
  
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);
  
  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  
  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  ipcMain.handle('getSources', async () => {
    return await desktopCapturer.getSources({ types: ['window', 'screen'] })
  })
  
  ipcMain.handle('showSaveDialog', async () => {
    return await dialog.showSaveDialog({
      buttonLabel: 'Save video',
      defaultPath: `vid-${Date.now()}.webm`
    });
  })
  
  ipcMain.handle('getOperatingSystem', () => {
    return process.platform
  })