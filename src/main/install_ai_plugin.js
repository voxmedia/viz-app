import fs from 'fs'
import path from 'path'
import {dialog} from 'electron'
import state from './index'
import crypto from 'crypto'
import { dispatch } from './ipc'
import { alert, confirm, error, chooseFolder } from './dialogs'
import { streamCopyFile } from '../lib'

const PATHS = {
  'darwin': [
    '/Applications/Adobe Illustrator CC 2018/Adobe Illustrator.app',
    '/Applications/Adobe Illustrator CC 2017/Adobe Illustrator.app',
    '/Applications/Adobe Illustrator CC 2015/Adobe Illustrator.app',
    '/Applications/Adobe Illustrator CC 2014/Adobe Illustrator.app',
    '~/Applications/Adobe Illustrator CC 2018/Adobe Illustrator.app',
    '~/Applications/Adobe Illustrator CC 2017/Adobe Illustrator.app',
    '~/Applications/Adobe Illustrator CC 2015/Adobe Illustrator.app',
    '~/Applications/Adobe Illustrator CC 2014/Adobe Illustrator.app',
  ],
}

let DEFAULT_PROGRAMS_DIR = null
let SCRIPTS_DIR = null
if ( process.platform === 'darwin' ) {
  DEFAULT_PROGRAMS_DIR = '/Applications'
  SCRIPTS_DIR = 'Presets.localized/en_US/Scripts'
} else if ( process.platform === 'win32' ) {
  DEFAULT_PROGRAMS_DIR = 'C:\\Program Files\\'
  SCRIPTS_DIR = 'Presets\\en_US\\Scripts'
}

function guessAppPath() {
  if ( process.platform in PATHS ) {
    let appPath = PATHS[process.platform].find((path) => fs.existsSync(path))
    if ( appPath ) {
      return Promise.resolve(path.dirname(appPath))
    } else {
      return Promise.reject()
    }
  }
}

function chooseAppPath(parentWin) {
  const message = "Can't find the Adobe Illustrator install location.\n\nClick 'Choose Illustrator Folder' to specify the install location yourself, or cancel installation."
  return confirm({parentWin, message, confirmLabel: 'Choose Illustrator Folder'})
    .then(() => {
      return chooseFolder({
        parentWin,
        title: 'Choose Illustrator Folder',
        defaultPath: DEFAULT_PROGRAMS_DIR,
      })
    })
}

function findScriptsPath(appPath) {
  const scriptsPath = path.join(appPath, SCRIPTS_DIR)

  if ( !fs.existsSync(scriptsPath) || !fs.statSync(scriptsPath).isDirectory() ) {
    console.error("Can't find Adobe Illustrator scripts folder. Looked here: ", scriptsPath)
    return Promise.reject(new Error('Adobe Illustrator Scripts folder is missing.'))
  }
  return Promise.resolve(scriptsPath)
}

function copyScript(scriptsPath) {
  const src = path.join(state.staticPath, 'ai2html.js')
  const dest = path.join(scriptsPath, 'ai2html.js')
  return streamCopyFile(src, dest).then(() => scriptsPath)
}

function calcHash(filename, type='sha1') {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(type)
    hash.on('readable', () => {
      const data = hash.read()
      if ( data ) resolve(data.toString('hex'))
    })
    hash.on('error', reject)
    fs.createReadStream(filename).pipe(hash)
  })
}

function isInstalled() {
  const installPath = state.data.Settings.scriptInstallPath
  return Promise.resolve(installPath && fs.existsSync(installPath))
}

function isUpdated() {
  const installPath = state.data.Settings.scriptInstallPath
  if ( ! fs.existsSync(installPath) ) return Promise.resolve(null)
  return calcHash(installPath).then((installedHash) => AI2HTML_HASH === installedHash)
}

export function install({parentWin = null, forceInstall = false} = {}) {
  const startupCheck = state.data.Settings.disableAi2htmlStartupCheck
  const installPath = state.data.Settings.scriptInstallPath

  Promise.all([isInstalled(), isUpdated()])
    .then(([installed, updated]) => {
      let verb
      if(!installed) verb = 'Install'
      else if (installed && !updated) verb = 'Update'
      else if (forceInstall) verb = 'Reinstall'
      else return;

      dialog.showMessageBox(parentWin, {
        type: 'question',
        title: `${verb} ai2html`,
        message: `Would you like to ${verb.toLowerCase()} ai2html?`,
        defaultId: 1,
        buttons: ['No', `${verb} ai2html`],
        checkboxLabel: "Always check on startup",
        checkboxChecked: !startupCheck,
      }, (res, checkboxChecked) => {
        dispatch('set', {key: 'disableAi2htmlStartupCheck', val: !checkboxChecked})

        if ( res === 0 ) return;

        let prom
        if (!installed) {
          prom = guessAppPath()
            .then(findScriptsPath)
            .catch(() => chooseAppPath(parentWin).then(findScriptsPath))
            .then(copyScript)
        } else {
          prom = copyScript(path.dirname(installPath))
        }

        prom.then(
          (path) => {
            alert({parentWin, message: 'The ai2html script has been installed.'})
            if (!installed) dispatch('set', {key: 'scriptInstallPath', val: path})
          },
          (err) => {
            if ( err.code && err.code == 'EACCES' ) {
              error({parentWin, message: `The ai2html script install failed.\n\nYou do not have permission to install the plugin.\n\nPlease give yourself write access to ${path.dirname(err.path)}`, details: err.toString()})
            } else {
              console.error('install script failed', err)
              error({parentWin, message: 'The ai2html script install failed.', details: err.toString()})
            }
          }
        )
      })

    })
}

export function checkOnLaunch() {
  if ( state.data.Settings.disableAi2htmlStartupCheck === true ) return;
  install()
}
