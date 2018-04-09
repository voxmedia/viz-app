import { dialog } from 'electron'

export function errorDialog({parentWin, message}) {
  return new Promise(resolve => {
    dialog.showMessageBox(
      parentWin || null,
      {
        type: 'error',
        title: 'An error occurred',
        message,
      },
      resolve
    )
  })
}
