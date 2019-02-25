import fs from 'fs'
import path from 'path'
import {dialog, app} from 'electron'
import log from 'electron-log'
import crypto from 'crypto'
import sudo from 'sudo-prompt'

import state from './index'
import { dispatch } from './ipc'
import { alert, confirm, error, chooseFolder } from './dialogs'
import { render } from '../lib'
import PACKAGE_INFO from '../../package.json'

// Known install paths of Adobe Illustrator. We'll check these to see if AI is
// installed.
const PATHS = {
  'darwin': [
    '/Applications/Adobe Illustrator CC 2019',
    '/Applications/Adobe Illustrator CC 2018',
    '/Applications/Adobe Illustrator CC 2017',
    '/Applications/Adobe Illustrator CC 2015',
    '/Applications/Adobe Illustrator CC 2014',
    '~/Applications/Adobe Illustrator CC 2019',
    '~/Applications/Adobe Illustrator CC 2018',
    '~/Applications/Adobe Illustrator CC 2017',
    '~/Applications/Adobe Illustrator CC 2015',
    '~/Applications/Adobe Illustrator CC 2014',
  ],
  'win32': [
    'C:\\Program Files\\Adobe\\Adobe Illustrator CC 2019',
    'C:\\Program Files\\Adobe\\Adobe Illustrator CC 2018',
    'C:\\Program Files\\Adobe\\Adobe Illustrator CC 2017',
    'C:\\Program Files\\Adobe\\Adobe Illustrator CC 2015',
    'C:\\Program Files\\Adobe\\Adobe Illustrator CC 2014',
  ]
}

// Hash algorithm used to compute a hash of the ai2html plugin to detect if
// and update is needed
const HASH_ALGO = 'sha1'

// For Mac OS X the sudo prompt likes an icon, when in production, we need to
// generate a path to the installed app package icon.
let MACOS_SUDO_ICON = null
if ( process.env.NODE_ENV === 'production' ) {
  MACOS_SUDO_ICON = path.join(path.dirname(app.getAppPath()), 'Vizier.icns')
} else {
  MACOS_SUDO_ICON = PACKAGE_INFO.build.mac.icon
}
const SUDO_OPTS = {
  name: PACKAGE_INFO.build.productName,
  icns: MACOS_SUDO_ICON
}

let DEFAULT_PROGRAMS_DIR = null
let SCRIPTS_DIR = null
let COPY_CMD = null
if ( process.platform === 'darwin' ) {
  DEFAULT_PROGRAMS_DIR = '/Applications'
  SCRIPTS_DIR = 'Presets.localized/en_US/Scripts'
  COPY_CMD = 'cp'
} else if ( process.platform === 'win32' ) {
  DEFAULT_PROGRAMS_DIR = 'C:\\Program Files\\'
  SCRIPTS_DIR = 'Presets\\en_US\\Scripts'
  COPY_CMD = 'copy'
}

// Try to guess the path to Adobe Illustrator
function guessAppPath() {
  if ( process.platform in PATHS ) {
    let appPath = PATHS[process.platform].find((path) => fs.existsSync(path))
    if ( appPath ) {
      return Promise.resolve(appPath)
    } else {
      return Promise.reject()
    }
  } else {
    return Promise.reject()
  }
}

// Ask the user to identify the installed path to Adobe Illustrator
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

// Find the scripts subdirectory of the installed adobe illustrator
function findScriptsPath(appPath) {
  const scriptsPath = path.join(appPath, SCRIPTS_DIR)

  if ( !fs.existsSync(scriptsPath) || !fs.statSync(scriptsPath).isDirectory() ) {
    log.error("Can't find Adobe Illustrator scripts folder. Looked here: ", scriptsPath)
    return Promise.reject(new Error('Adobe Illustrator Scripts folder is missing.'))
  }

  return Promise.resolve(scriptsPath)
}

// Generate the ai2html script from a template
function renderAi2htmlScript() {
  return render('ai2html.js.ejs', {settings: state.data.Settings})
}

// Save the generated ai2html script to a temp location, then try to copy into
// Adobe Illustrator with escalated permissions.
function copyScript(scriptsPath) {
  const output = renderAi2htmlScript()
  const tempDest = path.join(app.getPath('userData'), 'ai2html.js')
  const dest = path.join(scriptsPath, 'ai2html.js')
  fs.writeFileSync(tempDest, output)
  return new Promise((resolve, reject) => {
    const command = `${COPY_CMD} "${tempDest}" "${dest}"`
    sudo.exec(command, SUDO_OPTS, (error, stdout, stderr) => {
      if (error) {
        log.error('Sudo install ai2html plugin failed', error, stdout, stderr)
        reject(new Error("Failed to install AI2HTML plugin"))
      } else {
        resolve(scriptsPath)
      }
    })
  })
}

// Calculate the hash of a file
function calcHash(filename) {
  return new Promise((resolve, reject) => {
    if ( !fs.existsSync(filename) ) return reject(`File not found ${filename}`)
    const hash = crypto.createHash(HASH_ALGO)
    hash.on('readable', () => {
      const data = hash.read()
      if ( data ) resolve(data.toString('hex'))
    })
    hash.on('error', reject)
    fs.createReadStream(filename).pipe(hash)
  })
}

// Calculate the hash of the installed ai2html script
export function calcInstalledHash() {
  const installPath = state.data.Settings.scriptInstallPath
  if ( !installPath || !fs.existsSync(installPath) ) return null
  const scriptPath = path.join(installPath, 'ai2html.js')
  if ( !fs.existsSync(scriptPath) ) return null
  const hash = crypto.createHash(HASH_ALGO)
  hash.update(fs.readFileSync(scriptPath, 'utf8'))
  return hash.digest('hex')
}

// Calculate the hash of a freshly generated ai2html script
export function calcNewHash() {
  const hash = crypto.createHash(HASH_ALGO)
  hash.update(renderAi2htmlScript())
  return hash.digest('hex')
}

// Do all the things to get ai2html installed
export function install({parentWin = null, forceInstall = false} = {}) {
  const startupCheck = state.data.Settings.disableAi2htmlStartupCheck
  const installPath = state.data.Settings.scriptInstallPath

  // We don't recalculate hashes here because they should be accurate
  const installedHash = state.installedAi2htmlHash
  const newHash = state.newAi2htmlHash

  let verb
  if(!installedHash) verb = 'Install'
  else if (installedHash != newHash) verb = 'Update'
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
    dispatch('updateSettings', {disableAi2htmlStartupCheck: !checkboxChecked})

    if ( res === 0 ) return;

    let prom
    if (!installPath) {
      prom = guessAppPath()
        .then(findScriptsPath)
        .catch(() => chooseAppPath(parentWin).then(findScriptsPath))
        .then(copyScript)
    } else {
      prom = copyScript(installPath)
    }

    prom.then(
      (path) => {
        alert({parentWin, message: 'The ai2html script has been installed.'})
        state.installedAi2htmlHash = newHash
        dispatch('updateSettings', {scriptInstallPath: path})
      },
      (err) => {
        log.error('install script failed', err)
        if ( err ) {
          if ( err.code && (err.code == 'EACCES' || err.code == 'EPERM') ) {
            error({
              parentWin,
              message: `The ai2html script install failed.\n\nYou do not have permission to install the plugin.\n\nPlease give yourself write access to ${path.dirname(err.path)}`,
              details: err.toString()
            })
          } else {
            error({parentWin, message: `The ai2html script install failed.\n\n${err.toString()}`})
          }
        } else {
          error({parentWin, message: `The ai2html script install failed.`})
        }
      }
    )
  })
}

// Check if ai2html needs an update and prompt the user
export function checkOnLaunch() {
  // Calculate and stash these hashes at launch
  state.installedAi2htmlHash = calcInstalledHash()
  state.newAi2htmlHash = calcNewHash()

  if ( state.data.Settings.disableAi2htmlStartupCheck === true ) return;
  install({parentWin: state.mainWindow})
}
