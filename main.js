// Modules to control application life and create native browser window
const {app, BrowserWindow, screen} = require('electron')
const path = require('path')
const PiCamera = require('pi-camera') // TODO: Why is this here?
const fs = require('fs').promises
const bootstrap = require('./data/bootstrap.json')

function createWindow () {
    let display
    if (bootstrap.window.externalDisplay)
        display = screen.getAllDisplays().find(d => d.bounds.x || d.bounds.y)

    const mainWindow = new BrowserWindow({
        width: bootstrap.window.width,
        height: bootstrap.window.height,
        autoHideMenuBar: bootstrap.window.autoHideMenuBar,
        frame: bootstrap.window.frame,
        x: bootstrap.window.x + (display ? display.bounds.x : 0),
        y: bootstrap.window.y + (display ? display.bounds.y : 0),
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    mainWindow.loadFile(bootstrap.mainDocument)
    if (bootstrap.window.fullScreen)
        mainWindow.setFullScreen(true)
    if (bootstrap.window.developerTools)
        mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
        if (!BrowserWindow.getAllWindows())
            createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit()
})
