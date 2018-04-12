import fs from 'fs'
import path from 'path'
import {dialog} from 'electron'
import state from './index'

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

let WIN = null

function guessAppPath() {
  return new Promise((resolve, reject) => {
    if ( process.platform in PATHS ) {
      let appPath = PATHS[process.platform].find((path) => fs.existsSync(path))
      if ( appPath ) {
        resolve(path.dirname(appPath))
      } else {
        reject()
      }
    }
  })
}

function chooseAppPath() {
  return new Promise((resolve, reject) => {
    dialog.showMessageBox(WIN, {
      buttons: ['Cancel', 'Choose Illustrator Folder'],
      defaultId: 1,
      title: 'Choose Illustrator Folder',
      message: "Can't find the Adobe Illustrator install location.\n\nClick 'Choose Illustrator Folder' to specify the install location yourself, or cancel installation.",
    }, (resp) => {
      if ( resp === 0 ) return reject()
      dialog.showOpenDialog(WIN, {
        title: 'Choose Illustrator Folder',
        defaultPath: DEFAULT_PROGRAMS_DIR,
        properties: ['openDirectory',],
      }, (filePaths) => {
        resolve(filePaths[0])
      })
    })
  })
}

function findScriptsPath(appPath) {
  const scriptsPath = path.join(appPath, SCRIPTS_DIR)
  console.log(`scriptsPath: ${scriptsPath}`)
  return new Promise((resolve, reject) => {
    if ( !fs.existsSync(scriptsPath) || !fs.statSync(scriptsPath).isDirectory() ) {
      console.error("Can't find Adobe Illustrator scripts folder. Looked here: ", scriptsPath)
      return reject(new Error('Adobe Illustrator Scripts folder is missing.'))
    }
    resolve(scriptsPath)
  })
}

function copyScript(scriptsPath) {
  return new Promise((resolve, reject) => {
    const src = path.join(state.staticPath, 'ai2html.js')
    const dest = path.join(scriptsPath, 'ai2html.js')
    // Can't use copyFile because of asar
    const ws = fs.createWriteStream(dest)
    fs.createReadStream(src).pipe(ws)
    ws.on('error', err => reject(err))
    ws.on('finish', () => resolve(dest))
  })
}

export default function installAiPlugin() {
  const cb = arguments[arguments.length-1]
  WIN = arguments.length > 1 && arguments[0] ? arguments[0] : null
  guessAppPath()
    .then(findScriptsPath)
    .catch(() => chooseAppPath().then(findScriptsPath))
    .then(copyScript)
    .then((path) => {
      dialog.showMessageBox(WIN, {
        title: 'Install complete',
        message: `The ai2html script has been installed.`,
      })
      WIN = null
      if ( cb ) cb(true)
    })
    .catch((err) => {
      if ( err )
        dialog.showMessageBox(WIN, {
          title: 'Install failed',
          message: `The ai2html script install failed.\n\n${err.toString()}`,
        })
      WIN = null
      if ( cb ) cb(false)
    })
}
