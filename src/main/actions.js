import { dialog, BrowserWindow, shell, app, clipboard, Notification } from 'electron'
import uuid from 'uuid'
import path from 'path'
import fs from 'fs-extra'
import { slugify } from 'underscore.string'
import yaml from 'js-yaml'
import log from 'electron-log'
import { autoUpdater } from 'electron-updater'

import { dispatch, resetState } from './ipc'
import state from './index'
import { install } from './install_ai_plugin'
import { run } from './workers'
import { error, alert, confirm } from './dialogs'
import storage from './storage'
import defaultData from './default_data'

import { expandHomeDir, compactHomeDir } from '../lib'
import renderEmbedCode from '../lib/embed_code'

export function newProject() {
  const projectsDir = expandHomeDir(state.data.Settings.projectDir, app.getPath('home'))
  if ( !fs.existsSync(projectsDir) ) fs.ensureDirSync(projectsDir)
  dialog.showSaveDialog(
    state.mainWindow,
    {
      title: 'Create a new project',
      defaultPath: projectsDir,
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
    const ppath = compactHomeDir(filename, app.getPath('home'))

    if ( fs.existsSync(filename) ) {
      const stats = fs.statSync(filename)
      if ( !stats.isDirectory() ) {
        return error({
          parentWin: state.mainWindow,
          message: 'This type of file is not supported',
          details: `File was ${filename}`,
        })
      }

      if ( !fs.existsSync(path.join(filename, `${title}.ai`)) ) {
        return error({
          parentWin: state.mainWindow,
          message: `This is not a project folder. It is missing the Illustrator file "${title}.ai".`,
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
      path: compactHomeDir(filename, app.getPath('home')),
      status: "new",
      deployedDate: null,
      errorMessage: null,
      focus: false,
    }

    dispatch( 'project_create', project )

    if ( !fs.existsSync(filename) ) {
      run('project_create', { project, settings: state.data.Settings })
        .then((p) => {
          log.debug("Project created successfully!")
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
      defaultPath: expandHomeDir(state.data.Settings.projectDir, app.getPath('home')),
      message: 'Select an existing project folder to add.',
      properties: [ 'openDirectory', 'multiSelections' ]
  }, (filePaths) => {
    if (!filePaths || filePaths.length === 0) return;

    addProjects(filePaths)
  })
}

export function deployProject() {
  if ( !state.selectedProject ) return log.debug('deployProject: No selected project!')
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
  if ( !state.selectedProject ) return log.debug('openFolder: No selected project!')
  const projectPath = expandHomeDir(state.selectedProject.path, app.getPath('home'))
  if (fs.existsSync(projectPath))
    shell.openItem(projectPath)
  else
    error({
      parentWin: state.mainWindow,
      message: `Project folder is missing.\r\n\r\nIt should be here:\r\n${projectPath}`
    })
}

export function openInIllustrator() {
  if ( !state.selectedProject ) return log.debug('openInIllustrator: No selected project!')
  const p = state.selectedProject
  const projectPath = expandHomeDir(state.selectedProject.path, app.getPath('home'))
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
    log.error('copyEmbedCode: ' + e.message)
    if ( e.message == 'Missing project config.yml' ) {
      error({
        parentWin: state.mainWindow,
        message: 'Project ai2html output is missing.\r\n\r\nRun ai2html from the File > Scripts menu in Illustrator, then try again.'
      })
    }
  }
}

export function copyPreviewLink() {
  if ( !state.selectedProject ) return log.debug('copyLink: No selected project!')
  const project = state.selectedProject
  if ( project.status !== 'deployed') {
    error({parentWin: state.mainWindow, message: 'Project has not been deployed.\r\n\r\nDeploy the project before attempting to copy the link'})
    return log.debug('copyLink: The project has not been deployed.')
  }
  const slug = slugify(state.selectedProject.title)
  const deployUrl = `${state.data.Settings.deployBaseUrl}/${slug}/preview.html`
  clipboard.writeText(deployUrl, 'text/html')
}

export function removeFromList() {
  if ( !state.selectedProject ) return log.debug('removeFromList: No selected project!')
  dispatch('project_remove', state.selectedProject.id)
}

export function removeFromServer() {
  const p = state.selectedProject
  if ( !p ) return log.debug('removeFromServer: No selected project!')

  dialog.showMessageBox(
    state.mainWindow,
    {
      buttons: ['Cancel', 'Delete from internet'],
      defaultId: 0,
      title: `Permanently delete ${p.title}`,
      message: "This will delete the project from the internet.\r\n\r\nAre you sure you want to do this?",
    }, (resp) => {
      if ( resp === 0 ) return

      log.debug('removeFromServer')
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
  if ( !p ) return log.debug('deleteAll: No selected project!')
  const projectPath = expandHomeDir(state.selectedProject.path, app.getPath('home'))

  dialog.showMessageBox(
    state.mainWindow,
    {
      buttons: ['Cancel', 'Delete all'],
      defaultId: 0,
      title: `Permanently delete ${p.title}`,
      message: "This will delete the project from your hard drive; there is no undo!\r\n\r\nAre you sure you want to do this?",
    }, (resp) => {
      if ( resp === 0 ) return
      fs.remove(projectPath, (err) => {
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

  const winWidth = process.platform === 'win32' ? 580 : 520
  const winHeight = 512

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
      log.debug(data)
      state.data = data
      resetState(data)
    })
  })
}

export function resetSettings() {
  confirm({
    parentWin: state.settingsWindow,
    message: 'Do you wish to reset and clear your settings?',
    confirmLabel: 'Reset settings'
  }).then(() => {
    state.installedAi2htmlHash = null
    state.newAi2htmlHash = null
    dispatch('resetSettings', defaultData.Settings)
  })
}

const ALLOWED_KEYS = [
  'deployBaseUrl', 'deployType',
  'awsBucket', 'awsPrefix', 'awsRegion', 'awsAccessKeyId', 'awsSecretAccessKey',
  'siteConfigName', 'extraPreviewCss', 'extraEmbedCss', 'ai2htmlFonts'
]

export function importSettings() {
  dialog.showOpenDialog( state.settingsWindow, {
    message: 'Select a config file to load.',
    filters: [{name: 'Viz Config', extensions: ['vizappconfig']}],
    properties: [ 'openFile' ]
  }, (filePaths) => {
    if (!filePaths || filePaths.length === 0) return;

    const configFile = filePaths[0]
    const configContent = fs.readFileSync(configFile, 'utf8')
    const data = yaml.safeLoad(configContent)
    const configVersion = data.version || 1

    if ( configVersion != 1 ) {
      error({
        parentWin: state.settingsWindow,
        message: 'This config file is for a different version of the app.'
      })
    } else {
      const newSettings = {}
      for ( const k of ALLOWED_KEYS ) {
        if ( k in data && data[k] ) newSettings[k] = data[k]
      }
      dispatch('updateSettings', newSettings)
    }
  })
}

export function openLog() {
  const filename = path.join(app.getPath('logs'), 'log.log')
  if ( fs.existsSync(filename) ) {
    shell.openItem(filename)
  } else {
    alert({message: 'No log to open.'})
  }
}

export function checkForUpdates({alertNoUpdates = false} = {}) {
  return autoUpdater.checkForUpdates()
    .then(it => {
      return confirm({
        message: 'A new update is available. Do you wish to download and install it?',
        confirmLabel: 'Install update'
      }).then(() => {
        return autoUpdater.downloadUpdate(it.cancellationToken)
          .then(() => {
            new Notification({
              title: "Update is downloaded and ready to install",
              body: `${this.app.name} version ${it.updateInfo.version} will be automatically installed on exit`
            }).show()
          }, (err) => {
            log.error('Update download failed', err)
            error({
              message: 'Update download failed. Please check your internet connection and try again.'
            })
          })
      }, () => {
        log.debug('User declined update')
      })
    }, (err) => {
      log.info(err)
      if ( alertNoUpdates )
        alert({ message: 'No updates are available for download.' })
    })
}
