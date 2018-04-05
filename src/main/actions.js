import { dialog, BrowserWindow, shell } from 'electron'
import uuid from 'uuid'
import path from 'path'
import _ from 'lodash'
import { dispatch } from './ipc'
import state from './index'
import installAiPlugin from './installAiPlugin'
import { run } from './workers'
import rmrf from 'rimraf'

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

      run('project_create', { project, settings: state.data.Settings })
        .then(pProject => {
          console.log(pProject)
          if(!_.isEqual(pProject, project))
            console.error('changes in project!!!')
        })

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
  const p = state.selectedProject
  if ( !p ) return console.error('deleteAll: No selected project!')

  dialog.showMessageBox(
    state.mainWindow,
    {
      buttons: ['Cancel', 'Delete all'],
      defaultId: 0,
      title: `Permanently delete ${p.title}`,
      message: "This will delete the project from your hard drive and the internet. Are you sure you want to do this? There is no undo!",
    }, (resp) => {
      if ( resp === 0 ) return
      rmrf(p.path, (err) => {
        if (err) dispatch('project_error', p.id, err)
        else dispatch('project_remove', p.id)
      })
    }
  )
}

export function editSettings() {
  const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#settings`
    : `file://${__dirname}/index.html#settings`

  const winWidth = 520
  const winHeight = 340

  state.settingsWindow = new BrowserWindow({
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

  state.settingsWindow.loadURL(winURL)

  if (process.platform === 'darwin')
    state.settingsWindow.setSheetOffset(22)

  state.settingsWindow.on('closed', () => {
    state.settingsWindow = null
  })

  state.settingsWindow.on('ready-to-show', () => {
    state.settingsWindow.show()
  });
}

export function installAi2html(win) {
  installAiPlugin(win, (success) => {
    console.log(`Install plugin status: ${success ? 'installed' : 'failed'}`)
  })
}
