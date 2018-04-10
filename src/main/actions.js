import { dialog, BrowserWindow, shell, app, clipboard } from 'electron'
import uuid from 'uuid'
import path from 'path'
import rmrf from 'rimraf'
import fs from 'fs'
import { slugify } from 'underscore.string'
import yaml from 'js-yaml'

import { dispatch, resetState } from './ipc'
import state from './index'
import installAiPlugin from './installAiPlugin'
import { run } from './workers'
import { errorDialog } from './error'
import storage from './storage'
import embedCode from './embedCode'

import { expandHomeDir, compactHomeDir } from '../lib'

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
        path: compactHomeDir(filename),
        status: "new",
        deployedDate: null,
        errorMessage: null,
        focus: false,
      }

      run('project_create', { project, settings: state.data.Settings })
        .then((p) => {
          console.log("Project created successfully!")
        }, (err) => {
          dispatch( 'project_error', [project.id, err.toString()] )
        })

      dispatch( 'project_create', project )
    })
}

export function deployProject() {
  if ( !state.selectedProject ) return console.error('deployProject: No selected project!')
  const project = state.selectedProject
  dispatch( 'project_status', [project.id, 'deploying'] )
  run('project_deploy', { project, settings: state.data.Settings, userData: app.getPath('userData') })
    .then((p) => {
      dispatch( 'project_status', [project.id, 'deployed'] )
    }, (err) => {
      dispatch( 'project_error', [project.id, err] )
      errorDialog({parentWin: state.mainWindow, message: err})
    })
}

export function openFolder() {
  if ( !state.selectedProject ) return console.error('openFolder: No selected project!')
  const ppath = path.join(state.selectedProject.path, '')
  if (fs.existsSync(ppath))
    shell.openItem(ppath)
  else
    errorDialog({
      parentWin: state.mainWindow,
      message: `Project folder is missing.\r\n\r\nIt should be here:\r\n${project.path}`
    })
}

export function openInIllustrator() {
  if ( !state.selectedProject ) return console.error('openInIllustrator: No selected project!')
  const p = state.selectedProject
  const filepath = path.join(p.path, `${p.title}.ai`)
  if (fs.existsSync(filepath))
    shell.openItem(filepath)
  else
    errorDialog({
      parentWin: state.mainWindow,
      message: `Illustrator file is missing.\r\n\r\nIt should be here:\r\n${filepath}`
    })
}

export function copyEmbedCode() {
  if ( !state.selectedProject ) return console.error('copyEmbedCode: No selected project!')

  const projectPath = expandHomeDir(state.selectedProject.path)
  const configFile = path.join(projectPath, 'src', 'config.yml')

  if ( !fs.existsSync(configFile) ) {
    errorDialog({
      parentWin: state.mainWindow,
      message: 'Project ai2html output is missing.\r\n\r\nRun ai2html from the File > Scripts menu in Illustrator, then try again.'
    })
    return console.error('copyEmbedCode: Missing config.yml for project!')
  }

  const config = yaml.safeLoad(fs.readFileSync(configFile, 'utf8'))
  const p = state.selectedProject
  const slug = slugify(state.selectedProject.title)
  const deploy_url = `${state.data.Settings.deployBaseUrl}/${slug}/`
  const fallback_img_url = `${deploy_url}fallback.png`
  const fallback_img_width = config.fallback_image_width
  const fallback_img_height = config.fallback_image_height

  // collect all the artboard heights from the config file
  const heights = []
  for ( let k in config ) {
    const m = k.match(/^artboard_(.+)_height$/)
    if (m) heights.push(config[k])
  }

  // if all the artboards are the same height, we can just set the height and
  // disable the responsive resizable stuff, set the iframe height to the min height
  let resizable = true
  let height = 150
  if (heights.length > 0) {
    resizable = !heights.every(h => h === heights[0])
    height = Math.min(...heights)
  }

  const html = embedCode({
    slug,
    deploy_url,
    fallback_img_url,
    fallback_img_width,
    fallback_img_height,
    height,
    resizable
  }).replace(/\s+/g, ' ').trim()
  clipboard.writeText(html, 'text/html')
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
          errorDialog({parentWin: state.mainWindow, message: err})
        })
    }
  )
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
      message: "This will delete the project from your hard drive and the internet; there is no undo!\r\n\r\nAre you sure you want to do this?",
    }, (resp) => {
      if ( resp === 0 ) return
      rmrf(p.path, (err) => {
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
  const winHeight = 430

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

export function clearState() {
  storage.clear(() => {
    storage.load((err, data) => {
      console.log(data)
      state.data = data
      resetState(data)
    })
  })
}
