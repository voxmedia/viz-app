import { ipcMain, BrowserWindow } from 'electron'
import ProjectContextMenu from './menus/ProjectContextMenu'
import InputContextMenu from './menus/InputContextMenu'
import state from './index'
import storage from './storage'
import { newProject, addProjects, deployProject, editSettings, installAi2html, openInIllustrator, importSettings, resetSettings } from './actions'
import { calcInstalledHash, calcNewHash } from './install_ai_plugin'

// Sync messages
ipcMain.on( 'get-state', (eve) => {
  eve.returnValue = state.data
} )

ipcMain.on( 'has-focus', (eve) => {
  eve.returnValue = eve.sender.isFocused()
} )

ipcMain.on( 'get-hashes', (eve) => {
  eve.returnValue = {
    installedHash: state.installedAi2htmlHash,
    newHash: state.newAi2htmlHash
  }
} )


// Async messages
ipcMain.on( 'project-context-menu', (event, arg) => {
  const menu = ProjectContextMenu(arg)
  const win = BrowserWindow.fromWebContents(event.sender)
  menu.popup({window: win, async: true})
  event.sender.send('context-menu-close', arg)
} )

ipcMain.on( 'input-context-menu', (event, arg) => {
  const menu = InputContextMenu(arg)
  const win = BrowserWindow.fromWebContents(event.sender)
  menu.popup({window: win, async: true})
  event.sender.send('context-menu-close', arg)
} )

ipcMain.on( 'store-mutate', (eve, arg) => {
  if ( !arg.state )
    return console.error('State is missing in store-mutate ipc', arg.mutation, arg.state)

  // Parse and cache current state
  const oldData = state.data
  state.data = JSON.parse( arg.state )

  // Recalculate the ai2html script hash if necessary
  if ( state.data.Settings.ai2htmlFonts != oldData.Settings.ai2htmlFonts )
    state.newAi2htmlHash = calcNewHash()

  // Make sure other windows have same state
  const srcWin = BrowserWindow.fromWebContents(eve.sender)
  BrowserWindow.getAllWindows().forEach((win) => {
    if ( srcWin.id !== win.id )
      win.webContents.send( 'store-replace-state', state.data )
  })

  // Adjust selectedProject based on mutation
  if ( arg.mutation.type == 'PROJECT_BLUR' ) {
    if ( state.selectedProject && state.selectedProject.id == arg.mutation.payload )
      state.selectedProject = null
  } else if ( arg.mutation.type == 'PROJECT_FOCUS' ) {
    state.selectedProject = state.data.Projects.find(p => p.id == arg.mutation.payload)
  }

  // Store application state
  storage.pushState( state.data )
} )

ipcMain.on( 'new-project', (eve, arg) => {
  newProject()
} )

ipcMain.on( 'add-projects', (eve, arg) => {
  addProjects(arg)
} )

ipcMain.on( 'deploy-project', (eve, arg) => {
  deployProject()
} )

ipcMain.on( 'settings', (eve, arg) => {
  editSettings()
} )

ipcMain.on( 'project-open-ai', (eve, arg) => {
  openInIllustrator()
} )

ipcMain.on( 'install-ai2html', (eve, arg) => {
  if ( arg.from == 'settings-window' )
    installAi2html(state.settingsWindow)
  else
    installAi2html()
} )

ipcMain.on( 'import-settings', (eve, arg) => {
  if ( arg.from == 'settings-window' )
    importSettings(state.settingsWindow)
  else
    importSettings()
} )

ipcMain.on( 'reset-settings', (eve, arg) => {
  if ( arg.from == 'settings-window' )
    resetSettings(state.settingsWindow)
  else
    resetSettings()
} )

// Senders
export function dispatch(action, payload) {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send( 'store-action', {action, payload} )
  })
}

export function resetState(data) {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send( 'store-replace-state', data )
  })
}
