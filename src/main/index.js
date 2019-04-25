import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron'
import log from 'electron-log'
import Menubar from './menus/Menubar'
import storage from './storage'
import worker from './workers'
import { dispatch } from './ipc'
import { checkOnLaunch } from './install_ai_plugin'
import { checkForUpdates } from './actions'
import { getStaticPath } from '../lib'

import './autoupdate'

log.catchErrors()

// Global State struct for the app.
const state = {
  ready: false,
  quitting: false,
  mainWindow: null,
  settingsWindow: null,
  selectedProject: null,
  data: null,
  staticPath: getStaticPath()
}
export default state

// Set the main window URL
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
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

  if (process.platform == 'darwin') {
    state.mainWindow.setSheetOffset(22)
  } else {
    state.mainWindow.setMenu( Menubar() )
  }

  state.mainWindow.on('close', (eve) => {
    if (process.platform === 'darwin' && !state.quitting) {
      eve.preventDefault()
      state.mainWindow.hide()
    }
  })

  state.mainWindow.once('show', () => {
    // Setup autoupdates
    if (process.env.NODE_ENV === 'production')
      checkForUpdates()

    checkOnLaunch()
  })

  state.mainWindow.on('closed', () => state.mainWindow = null)
  state.mainWindow.on('ready-to-show', () => state.mainWindow.show())
}

function setupEventHandlers() {
  app.on('before-quit', () => state.quitting = true)

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('activate', () => {
    if (!state.ready || !state.data) return;
    if (state.mainWindow) state.mainWindow.show()
    else if (state.mainWindow === null) createWindow()
  })

  app.on('ready', () => {
    state.ready = true

    // Load app preferences then open the main window
    storage.load((error, data) => {
      state.data = data
      state.selectedProject = data.Projects.find(p => p.focus)
      createWindow()
      if ( process.platform === 'darwin' )
        Menu.setApplicationMenu( Menubar() )
    })
  })
}

// MacOS prevents multiple instances of the app running, but for other OSes
// we have to manage it ourselves.
if ( process.platform === 'darwin' ) {
  setupEventHandlers()
} else {
  const singleInstanceLock = app.requestSingleInstanceLock()
  if ( !singleInstanceLock ) {
    // App is already running, so quit.
    app.quit()
  } else {
    setupEventHandlers()
    // If a second instance attempts to run, restore and focus this instance's
    // main window.
    app.on('second-instance', () => {
      if ( state.mainWindow.isMinimized() ) {
        state.mainWindow.restore()
      }
      state.mainWindow.focus()
    })
  }
}
