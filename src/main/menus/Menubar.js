import path from 'path'
import fs from 'fs-extra'
import {app, Menu, shell} from 'electron'
import { newProject, openProject, editSettings, installAi2html, clearState, importSettings, openLog, checkForUpdates } from '../actions'
import { alert } from '../dialogs'
import state from '../index'
import storage from '../storage'

const MACOS_APP_MENU_TEMPLATE = {
  label: app.getName(),
  submenu: [
    {role: 'about'},
    {type: 'separator'},
    {label: 'Preferences', click(eve) { editSettings() }},
    {label: 'Import preferences', click(eve) { importSettings() }},
    {label: 'Install ai2html', click(eve) { installAi2html() }},
    {label: 'Check for updates', click(eve) { checkForUpdates({alertNoUpdates: true}) }},
    {type: 'separator'},
    {role: 'services', submenu: []},
    {type: 'separator'},
    {role: 'hide'},
    {role: 'hideothers'},
    {role: 'unhide'},
    {type: 'separator'},
    {role: 'quit'}
  ]
}

const MACOS_FILE_MENU_TEMPLATE = {
  label: 'File',
  submenu: [
    {label: 'New', accelerator: "CmdOrCtrl+N", click(eve) { newProject() }},
    {label: 'Open', accelerator: "CmdOrCtrl+O", click(eve) { openProject() }},
  ]
}

const FILE_MENU_TEMPLATE = {
  label: 'File',
  submenu: [
    {label: 'New', accelerator: "CmdOrCtrl+N", click(eve) { newProject() }},
    {label: 'Open', accelerator: "CmdOrCtrl+O", click(eve) { openProject() }},
    {type: 'separator'},
    {label: 'Settings', click(eve) { editSettings() }},
    {label: 'Import settings', click(eve) { importSettings() }},
    {label: 'Install ai2html', click(eve) { installAi2html() }},
    {label: 'Check for updates', click(eve) { checkForUpdates({alertNoUpdates: true}) }},
    {type: 'separator'},
    {role: 'quit'}
  ]
}

const MACOS_EDIT_MENU_TEMPLATE = {
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
}

const EDIT_MENU_TEMPLATE = {
  label: 'Edit',
  submenu: [
    {role: 'undo'},
    {role: 'redo'},
    {type: 'separator'},
    {role: 'cut'},
    {role: 'copy'},
    {role: 'paste'},
    {role: 'delete'},
    {role: 'selectall'}
  ]
}

const DEV_MENU_TEMPLATE = {
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

const MACOS_WINDOW_MENU_TEMPLATE = {
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
}

const MACOS_HELP_MENU_TEMPLATE = {
  role: 'help',
  submenu: [
    {
      label: 'Learn More',
      click () { shell.openExternal('https://github.com/voxmedia/viz-app') }
    },
    {
      label: 'Open log',
      click () { openLog() }
    }
  ]
}

const HELP_MENU_TEMPLATE = {
  role: 'help',
  submenu: [
    {
      label: 'Learn More',
      click () { shell.openExternal('https://github.com/voxmedia/viz-app') }
    },
    {
      label: 'Open log',
      click () { openLog() }
    },
    {type: 'separator'},
    {role: 'about'},
  ]
}

let MENUBAR_TEMPLATE
let MACOSX_MENUBAR_TEMPLATE

if (process.env.NODE_ENV === 'development') {
  MENUBAR_TEMPLATE = [
    FILE_MENU_TEMPLATE,
    DEV_MENU_TEMPLATE,
    HELP_MENU_TEMPLATE
  ]
  MACOSX_MENUBAR_TEMPLATE = [
    MACOS_APP_MENU_TEMPLATE,
    MACOS_FILE_MENU_TEMPLATE,
    MACOS_EDIT_MENU_TEMPLATE,
    DEV_MENU_TEMPLATE,
    MACOS_WINDOW_MENU_TEMPLATE,
    MACOS_HELP_MENU_TEMPLATE
  ]
} else {
  MENUBAR_TEMPLATE = [
    FILE_MENU_TEMPLATE,
    HELP_MENU_TEMPLATE
  ]
  MACOSX_MENUBAR_TEMPLATE = [
    MACOS_APP_MENU_TEMPLATE,
    MACOS_FILE_MENU_TEMPLATE,
    MACOS_EDIT_MENU_TEMPLATE,
    MACOS_WINDOW_MENU_TEMPLATE,
    MACOS_HELP_MENU_TEMPLATE
  ]
}

export default function Menubar () {
  if (process.platform === 'darwin') {
    return Menu.buildFromTemplate( MACOSX_MENUBAR_TEMPLATE )
  } else {
    return Menu.buildFromTemplate( MENUBAR_TEMPLATE )
  }
}
