import { dialog, BrowserWindow, shell } from 'electron'
import { dispatch } from './ipc'
import state from './index'
import uuid from 'uuid'
import path from 'path'

const homedir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
function expandHomeDir (p) {
  if (!p) return p;
  if (p == '~') return homedir;
  if (p.slice(0, 2) != '~' + path.sep) return p;
  return path.join(homedir, p.slice(2));
}

export function newProject() {
  dialog.showSaveDialog(
    state.mainWindow,
    {
      defaultPath: path.join(expandHomeDir(state.data.Settings.projectDir), 'My project'),
      nameFieldLabel: 'Project:', // TODO: why doesn't 'Project name:' display correctly?
      buttonLabel: 'Create'
    },
    (filename) => {
      if ( !filename ) return

      const project = {
        id: uuid(),
        title: path.basename(filename),
        path: filename,
        status: "new",
        deployedDate: null,
        errorMessage: null,
        focus: false,
      }

      dispatch( 'project_create', project )
    })
}

export function deployProject() {
  console.log('deploy-project', state.selectedProject.id)
}

export function editSettings() {
  const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#settings`
    : `file://${__dirname}/index.html#settings`

  const winWidth = 520
  const winHeight = 300

  let settingsWindow = new BrowserWindow({
    //parent: state.mainWindow,
    //modal: true,
    title: (process.platform == 'darwin') ? 'Preferences' : 'Settings',
    center: true,
    useContentSize: true,
    titleBarStyle: 'hidden',
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    width: winWidth,
    minWidth: winWidth,
    maxWidth: winWidth,
    height: winHeight,
    minHeight: winHeight,
    maxHeight: winHeight,
    show: false,
    webPreferences: {
      webgl: false,
      webaudio: false,
      textAreasAreResizeable: false,
    },
  })

  settingsWindow.loadURL(winURL)

  if (process.platform === 'darwin')
    state.mainWindow.setSheetOffset(22)

  /*
  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
  */

  settingsWindow.on('ready-to-show', () => {
    settingsWindow.show()
  });
}

export function openFolder() {
  if ( !state.selectedProject ) return console.error('No selected project!')
  shell.showItemInFolder(state.selectedProject.path)
}

export function copyEmbedCode() {
  console.log('copyEmbedCode')
}

export function removeFromList() {
  console.log('removeFromList')
}

export function removeFromServer() {
  console.log('removeFromServer')
}

export function deleteAll() {
  console.log('deleteAll')
}
