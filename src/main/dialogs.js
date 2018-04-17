import { dialog } from 'electron'

export function error({parentWin, message, details}) {
  return new Promise(resolve => {
    dialog.showMessageBox(
      parentWin || null,
      {
        type: 'error',
        title: 'An error occurred',
        message,
        details,
      },
      resolve
    )
  })
}

export function alert({parentWin, message, details}) {
  return new Promise(resolve => {
    dialog.showMessageBox(
      parentWin || null,
      {
        type: 'none',
        title: 'Alert',
        message,
        details,
      },
      resolve
    )
  })
}

export function confirm({parentWin, message, details, confirmLabel, defaultCancel}) {
  return new Promise((resolve, reject) => {
    dialog.showMessageBox(
      parentWin || null,
      {
        type: 'question',
        buttons: ['Cancel', confirmLabel || 'OK'],
        defaultId: defaultCancel ? 0 : 1,
        title: 'Confirm',
        message,
        details,
      }, (resp) => {
        if ( resp === 0 ) return reject()
        resolve()
      }
    )
  })
}

export function chooseFolder({ parentWin, title, defaultPath }) {
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog(parentWin, {
      title,
      defaultPath,
      properties: ['openDirectory',],
    }, (filePaths) => {
      if ( filePaths.length === 1 ) resolve(filePaths[0])
      else reject()
    })
  })
}
