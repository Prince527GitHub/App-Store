const { app, BrowserWindow, dialog } = require('electron');
const { ipcMain } = require('electron/main');
const path = require('path');

if (require('electron-squirrel-startup')) app.quit();

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        icon: `${__dirname}/assets/image/logo.png`,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.webContents.openDevTools();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("quit-app", () => app.quit());

ipcMain.handle("open-file", async() => {
    const files = await dialog.showOpenDialog({ properties: ['openDirectory'] });

    if (files.canceled) return null;
    return files.filePaths;
});