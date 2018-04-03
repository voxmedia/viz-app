import { dialog, BrowserWindow, shell } from 'electron'
import { dispatch } from './ipc'
import state from './index'
import uuid from 'uuid'
import path from 'path'
import installAiPlugin from './installAiPlugin'

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
  if ( !state.selectedProject ) return console.error('deployProject: No selected project!')
  console.log('deploy-project', state.selectedProject.id)
}

export function openFolder() {
  if ( !state.selectedProject ) return console.error('openFolder: No selected project!')
  shell.showItemInFolder(state.selectedProject.path)
}

export function copyEmbedCode() {
  if ( !state.selectedProject ) return console.error('copyEmbedCode: No selected project!')
  console.log('copyEmbedCode')
}

export function removeFromList() {
  if ( !state.selectedProject ) return console.error('removeFromList: No selected project!')
  dispatch('project_remove', state.selectedProject.id)
}

export function removeFromServer() {
  if ( !state.selectedProject ) return console.error('removeFromServer: No selected project!')
  console.log('removeFromServer')
}

export function deleteAll() {
  if ( !state.selectedProject ) return console.error('deleteAll: No selected project!')
  console.log('deleteAll')
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

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })

  settingsWindow.on('ready-to-show', () => {
    settingsWindow.show()
  });
}

export function installAi2html() {
  installAiPlugin((success) => {
    console.log(`Install plugin status: ${success ? 'installed' : 'failed'}`)
  })
}
