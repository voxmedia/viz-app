import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import Menubar from './menus/Menubar'
import { resetState } from './ipc'
import storage from './storage'
import worker from './workers'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

const state = {
  mainWindow: null,
  settingsWindow: null,
  selectedProject: null,
  data: null,
}
export default state

const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

if ( process.env.NODE_ENV === 'development' )
  storage.clear()

function appReady () {
  storage.load((error, data) => {
    state.data = data
    createWindow()
    Menu.setApplicationMenu( Menubar() )
  })
}

app.on('ready', appReady)

export function createWindow () {
  if ( state.mainWindow ) return

  /**
   * Initial window options
   */
  state.mainWindow = new BrowserWindow({
    useContentSize: true,
    titleBarStyle: 'hidden',
    maximizable: false,
    fullscreenable: false,
    width: 320,
    minWidth: 240,
    maxWidth: 620,
    height: 563,
    minHeight: 240,
    show: false,
    webPreferences: {
      webgl: false,
      webaudio: false,
      textAreasAreResizeable: false,
    },
  })

  state.mainWindow.loadURL(winURL)

  if (process.platform == 'darwin')
    state.mainWindow.setSheetOffset(22)

  state.mainWindow.on('closed', () => {
    state.mainWindow = null
  })

  state.mainWindow.on('ready-to-show', () => {
    state.mainWindow.show()
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (state.mainWindow === null) createWindow()
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
