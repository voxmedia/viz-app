import { ipcMain } from 'electron'
import ProjectContextMenu from './menus/ProjectContextMenu'
import state from './index'
import storage from './storage'
import { newProject, deployProject, editSettings } from './actions'

ipcMain.on( 'project-context-menu', (event, arg) => {
  const menu = ProjectContextMenu(arg)
  menu.popup({window: state.mainWindow, async: true})
  event.sender.send('context-menu-close', arg)
} )

ipcMain.on( 'store-mutate', (eve, arg) => {
  if ( !arg.state ) {
    console.error( 'State is missing in store-mutate ipc', arg.mutation, arg.state )
    return
  }

  state.data = JSON.parse( arg.state )

  if ( arg.mutation.type == 'PROJECT_BLUR' ) {
    if ( state.selectedProject && state.selectedProject.id == arg.mutation.payload )
      state.selectedProject = null
  } else if ( arg.mutation.type == 'PROJECT_FOCUS' ) {
    state.selectedProject = state.data.Projects.find(p => p.id == arg.mutation.payload)
  } else {
    console.log('store', arg.mutation)
    storage.pushState( state.data )
  }
} )

ipcMain.on( 'get-state', (eve) => {
  eve.returnValue = state.data
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

export function dispatch(action, payload) {
  return state.mainWindow.webContents.send( 'store-action', { action, payload } )
}

export function resetState(data) {
  return state.mainWindow.webContents.send( 'store-replace-state', data )
}
