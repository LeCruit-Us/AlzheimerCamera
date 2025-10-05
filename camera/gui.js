const { app, BrowserWindow, ipcMain } = require("electron");
const NodeWebcam = require("node-webcam");
const path = require("path");
const fs = require("fs");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile("preview.html");
}

app.whenReady().then(createWindow);

ipcMain.handle("capture-image", async () => {
  const imgFile = path.join(__dirname, "preview.jpg");
    // ...existing code...
    // Capture Image
    await new Promise((resolve, reject) => {
        Webcam.capture(imgFile, (err) => {
        if (err) reject(err);
        else {
            console.log("📸 Saved image:", imgFile);
            resolve();
        }
        });
    });
// ...existing code...
  return imgFile;
});