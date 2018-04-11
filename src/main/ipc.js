import { ipcMain, BrowserWindow } from 'electron'
import ProjectContextMenu from './menus/ProjectContextMenu'
import state from './index'
import storage from './storage'
import { newProject, deployProject, editSettings, installAi2html, openInIllustrator } from './actions'

// Sync messages
ipcMain.on( 'get-state', (eve) => {
  eve.returnValue = state.data
} )

ipcMain.on( 'has-focus', (eve) => {
  eve.returnValue = eve.sender.isFocused()
} )


// Async messages
ipcMain.on( 'project-context-menu', (event, arg) => {
  const menu = ProjectContextMenu(arg)
  const win = BrowserWindow.fromWebContents(event.sender)
  menu.popup({window: win, async: true})
  event.sender.send('context-menu-close', arg)
} )

ipcMain.on( 'store-mutate', (eve, arg) => {
  if ( !arg.state )
    return console.error('State is missing in store-mutate ipc', arg.mutation, arg.state)

  // Parse and cache current state
  state.data = JSON.parse( arg.state )

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
