import {app, Menu, shell} from 'electron'
import { newProject, editSettings } from '../actions'

const MACOSX_MENUBAR_TEMPLATE = [
  {
    label: app.getName(),
    submenu: [
      {role: 'about'},
      {type: 'separator'},
      {label: 'Preferences', click(eve) { editSettings() }},
      {type: 'separator'},
      {role: 'services', submenu: []},
      {type: 'separator'},
      {role: 'hide'},
      {role: 'hideothers'},
      {role: 'unhide'},
      {type: 'separator'},
      {role: 'quit'}
    ]
  },
  {
    label: 'File',
    submenu: [
      {label: 'New', accelerator: "CmdOrCtrl+N", click(eve) { newProject() }},
    ]
  },
  /** remove for production **/
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      {role: 'pasteandmatchstyle'},
      {role: 'delete'},
      {role: 'selectall'},
      {type: 'separator'},
      {
        label: 'Speech',
        submenu: [
          {role: 'startspeaking'},
          {role: 'stopspeaking'}
        ]
      }
    ]
  },
  /** remove for production **/
  {
    label: 'View',
    submenu: [
      {role: 'reload'},
      {role: 'forcereload'},
      {role: 'toggledevtools'},
    ]
  },
  {
    role: 'window',
    submenu: [
      {role: 'close'},
      {role: 'minimize'},
      {role: 'zoom'},
      {type: 'separator'},
      {
        label: app.getName(),
        accelerator: "CmdOrCtrl+1",
        click() {
          // TODO: bring back main window
          console.log('bring back main window');
        }
      },
      {type: 'separator'},
      {role: 'front'}
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () { shell.openExternal('https://github.com/voxmedia/vizier') }
      }
    ]
  }
]

export default function Menubar () {
  if (process.platform !== 'darwin') return null
  return Menu.buildFromTemplate( MACOSX_MENUBAR_TEMPLATE )
}
