import {app, Menu, shell} from 'electron'
import { newProject, openProject, editSettings, installAi2html, clearState, importSettings } from '../actions'
import state from '../index'
import storage from '../storage'

const MACOSX_MENUBAR_TEMPLATE = [
  {
    label: app.getName(),
    submenu: [
      {role: 'about'},
      {type: 'separator'},
      {label: 'Preferences', click(eve) { editSettings() }},
      {label: 'Import preferences', click(eve) { importSettings() }},
      {label: 'Install ai2html', click(eve) { installAi2html() }},
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
      {label: 'Open', accelerator: "CmdOrCtrl+O", click(eve) { openProject() }},
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
]

if (process.env.NODE_ENV === 'development') {
  /** remove for production **/
  MACOSX_MENUBAR_TEMPLATE.push(
    {
      label: 'Dev',
      submenu: [
        {role: 'reload'},
        {role: 'forcereload'},
        {role: 'toggledevtools'},
        {type: 'separator'},
        {
          label: 'Clear storage',
          click() { clearState() }
        },
      ]
    }
  )
}

MACOSX_MENUBAR_TEMPLATE.push(
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
          state.mainWindow.show()
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
)

export default function Menubar () {
  if (process.platform !== 'darwin') return null
  return Menu.buildFromTemplate( MACOSX_MENUBAR_TEMPLATE )
}
