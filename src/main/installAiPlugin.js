import fs from 'fs'
import path from 'path'
import {dialog} from 'electron'
import {state} from './index'

const PATHS = {
  'darwin': [
    '/Applications/Adobe Illustrator CC 2018/Adobe Illustrator CC 2018.app',
    '/Applications/Adobe Illustrator CC 2017/Adobe Illustrator CC 2017.app',
    '/Applications/Adobe Illustrator CC 2015/Adobe Illustrator CC 2015.app',
    '/Applications/Adobe Illustrator CC 2014/Adobe Illustrator CC 2014.app',
    '~/Applications/Adobe Illustrator CC 2018/Adobe Illustrator CC 2018.app',
    '~/Applications/Adobe Illustrator CC 2017/Adobe Illustrator CC 2017.app',
    '~/Applications/Adobe Illustrator CC 2015/Adobe Illustrator CC 2015.app',
    '~/Applications/Adobe Illustrator CC 2014/Adobe Illustrator CC 2014.app',
  ],
}

if ( process.platform === 'darwin' )
  const defaultProgramsDir = '/Applications'
else if ( process.platform === 'windows' )
  const defaultProgramsDir = 'C:\\Program Files\\'
else
  const defaultProgramsDir = null


function findAppPath(cb) {
  if ( process.platform in PATHS ) {
    let appPath = PATHS[process.platform].find((path) => fs.existsSync(path))
    if ( appPath ) cb(path.dirname(appPath))
    return
  }

  dialog.showMessageBox({
    buttons: ['Cancel', 'Choose Illustrator Folder'],
    defaultId: 1,
    title: 'Choose Illustrator Folder',
    message: "Can't find the Adobe Illustrator install location. Click 'Choose Illustrator Folder' to specify the install location yourself, or cancel installation.",
  }, (resp) => {
    if ( resp === 0 ) return cb(null)

    dialog.showOpenDialog({
      title: 'Choose Illustrator Folder',
      defaultPath: defaultProgramsDir,
      properties: {
        openFile: false,
        openDirectory: true,
        createDirectory: false,
        multiSelections: false,
      }
    }, (filePaths) => {
      cb(filePaths[0])
    })
  })
}

function installFile(appPath, cb) {
  const scriptsPath = path.join(appPath, 'Presets', 'en_US', 'Scripts')
  if ( !fs.existsSync(scriptsPath) || !fs.statSync(scriptsPath).isDirectory() )
    return cb(new Error('Adobe Illustrator Scripts folder is missing.'))

  fs.copyFile(path.join(__static, 'ai2html.js'), path.join(scriptsPath, 'ai2html.js'), (err) => {
    if (err) return cb(err)
    console.log('ai2html.js installed')
    if ( cb ) cb()
  })
}

export default function install(cb) {
  findAppPath((path) => {
    if ( !path ) {
      if ( cb ) cb(false)
      return
    }
    installFile(path, (err) => {
      if ( err ) throw err
      if ( cb ) cb(false)
      return
    })
  })
}
