import { dialog, BrowserWindow, shell, app, clipboard } from 'electron'
import uuid from 'uuid'
import path from 'path'
import rmrf from 'rimraf'
import fs from 'fs'
import { slugify } from 'underscore.string'

import { dispatch, resetState } from './ipc'
import state from './index'
import { install } from './install_ai_plugin'
import { run } from './workers'
import { error } from './dialogs'
import storage from './storage'

import { expandHomeDir, compactHomeDir } from '../lib'
import renderEmbedCode from '../lib/embed_code'

export function newProject() {
  dialog.showSaveDialog(
    state.mainWindow,
    {
      defaultPath: expandHomeDir(state.data.Settings.projectDir),
      nameFieldLabel: 'Project:', // TODO: why doesn't 'Project name:' display correctly?
      buttonLabel: 'Create'
    },
    (filename) => {
      if ( !filename ) return

      addProjects([filename])
    })
}

export function addProjects(filenames) {
  for ( const filename of filenames ) {
    const title = path.basename(filename)
    const ppath = compactHomeDir(filename)

    if ( fs.existsSync(filename) ) {
      const stats = fs.statSync(filename)
      if ( !stats.isDirectory() ) {
        return error({
          parentWin: state.mainWindow,
          message: `This type of file is not supported`,
          details: `File was ${filename}`,
        })
      }

      if ( !fs.existsSync(path.join(filename, 'src')) ) {
        return error({
          parentWin: state.mainWindow,
          message: `This is not a project folder`,
          details: `Folder was ${filename}`,
        })
      }
    }

    const dupe = state.data.Projects.find(p => {
      return slugify(p.title) === slugify(title) || p.path === ppath
    })

    if ( dupe ) {
      return error({
        parentWin: state.mainWindow,
        message: `There is already a project with the name ${title}`
      })
    }
  }

  for ( const filename of filenames ) {
    const project = {
      id: uuid(),
      title: path.basename(filename),
      path: compactHomeDir(filename),
      status: "new",
      deployedDate: null,
      errorMessage: null,
      focus: false,
    }

    dispatch( 'project_create', project )

    if ( !fs.existsSync(filename) ) {
      run('project_create', { project, settings: state.data.Settings })
        .then((p) => {
          console.log("Project created successfully!")
        }, (err) => {
          dispatch( 'project_error', [project.id, err.toString()] )
        })
    }
  }
}

export function openProject() {
  dialog.showOpenDialog(
    state.mainWindow,
    {
      defaultPath: expandHomeDir(state.data.Settings.projectDir),
      message: 'Select an existing project folder to add.',
      properties: [ 'openDirectory', 'multiSelections' ]
  }, (filePaths) => {
    if (!filePaths || filePaths.length === 0) return;

    addProjects(filePaths)
  })
}

export function deployProject() {
  if ( !state.selectedProject ) return console.error('deployProject: No selected project!')
  const project = state.selectedProject
  dispatch( 'project_status', [project.id, 'deploying'] )
  run('project_deploy', { project, settings: state.data.Settings })
    .then((p) => {
      dispatch( 'project_status', [project.id, 'deployed'] )
    }, (err) => {
      dispatch( 'project_error', [project.id, err] )
      error({parentWin: state.mainWindow, message: err})
    })
}

export function openFolder() {
  if ( !state.selectedProject ) return console.error('openFolder: No selected project!')
  const projectPath = expandHomeDir(state.selectedProject.path)
  if (fs.existsSync(projectPath))
    shell.openItem(projectPath)
  else
    error({
      parentWin: state.mainWindow,
      message: `Project folder is missing.\r\n\r\nIt should be here:\r\n${projectPath}`
    })
}

export function openInIllustrator() {
  if ( !state.selectedProject ) return console.error('openInIllustrator: No selected project!')
  const p = state.selectedProject
  const projectPath = expandHomeDir(state.selectedProject.path)
  const filepath = path.join(projectPath, `${p.title}.ai`)
  if (fs.existsSync(filepath))
    shell.openItem(filepath)
  else
    error({
      parentWin: state.mainWindow,
      message: `Illustrator file is missing.\r\n\r\nIt should be here:\r\n${filepath}`
    })
}

export function openPreview() {
  const slug = slugify(state.selectedProject.title)
  const deployUrl = `${state.data.Settings.deployBaseUrl}/${slug}/preview.html`
  shell.openExternal(deployUrl)
}

export function copyEmbedCode() {
  try {
    clipboard.writeText(
      renderEmbedCode({project: state.selectedProject, settings: state.data.Settings}),
      'text/html')
  } catch(e) {
    console.error('copyEmbedCode: ' + e.message)
    if ( e.message == 'Missing project config.yml' ) {
      error({
        parentWin: state.mainWindow,
        message: 'Project ai2html output is missing.\r\n\r\nRun ai2html from the File > Scripts menu in Illustrator, then try again.'
      })
    }
  }
}

export function copyPreviewLink() {
  if ( !state.selectedProject ) return console.error('copyLink: No selected project!')
  const project = state.selectedProject
  if ( project.status !== 'deployed') {
    error({parentWin: state.mainWindow, message: 'Project has not been deployed.\r\n\r\nDeploy the project before attempting to copy the link'})
    return console.error('copyLink: The project has not been deployed.')
  }
  const slug = slugify(state.selectedProject.title)
  const deployUrl = `${state.data.Settings.deployBaseUrl}/${slug}/preview.html`
  clipboard.writeText(deployUrl, 'text/html')
}

export function removeFromList() {
  if ( !state.selectedProject ) return console.error('removeFromList: No selected project!')
  dispatch('project_remove', state.selectedProject.id)
}

export function removeFromServer() {
  const p = state.selectedProject
  if ( !p ) return console.error('removeFromServer: No selected project!')

  dialog.showMessageBox(
    state.mainWindow,
    {
      buttons: ['Cancel', 'Delete from internet'],
      defaultId: 0,
      title: `Permanently delete ${p.title}`,
      message: "This will delete the project from the internet.\r\n\r\nAre you sure you want to do this?",
    }, (resp) => {
      if ( resp === 0 ) return

      console.log('removeFromServer')
      dispatch( 'project_status', [project.id, 'deploying'] )
      run('project_undeploy', { project, settings: state.data.Settings, userData: app.getPath('userData') })
        .then((p) => {
          dispatch( 'project_status', [project.id, 'new'] )
        }, (err) => {
          dispatch( 'project_error', [project.id, err] )
          error({parentWin: state.mainWindow, message: err})
        })
    }
  )
}

export function deleteAll() {
  const p = state.selectedProject
  if ( !p ) return console.error('deleteAll: No selected project!')
  const projectPath = expandHomeDir(state.selectedProject.path)

  dialog.showMessageBox(
    state.mainWindow,
    {
      buttons: ['Cancel', 'Delete all'],
      defaultId: 0,
      title: `Permanently delete ${p.title}`,
      message: "This will delete the project from your hard drive; there is no undo!\r\n\r\nAre you sure you want to do this?",
    }, (resp) => {
      if ( resp === 0 ) return
      rmrf(projectPath, (err) => {
        if (err) dispatch('project_error', [p.id, err.toString()])
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
  const winHeight = 630

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

export function installAi2html(parentWin) {
  install({parentWin, forceInstall: true})
}

export function clearState() {
  storage.clear(() => {
    storage.load((err, data) => {
      console.log(data)
      state.data = data
      resetState(data)
    })
  })
}
