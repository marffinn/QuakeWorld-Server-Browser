const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const { ipcMain } = require("electron");

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadFile("index.html");
  mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
ipcMain.on("close-me", (evt, arg) => {
  app.quit();
});

ipcMain.on("minimize-me", (evt, arg) => {
  mainWindow.minimize();
});
