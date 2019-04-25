import { Notification, app } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

import { error, alert, confirm } from './dialogs'
import state from './index'

// Configure the autoupdater.
// Set the update channel. TODO: make a setting
autoUpdater.channel = AUTOUPDATE_CHANNEL
autoUpdater.allowDowngrade = false
autoUpdater.autoInstallOnAppQuit = true
autoUpdater.autoDownload = false
// Use electron-log
autoUpdater.logger = log

// Setup auto update handling
autoUpdater.on('update-available', (eve) => {
  confirm({
    message: 'A new update is available. Do you wish to download and install it?',
    confirmLabel: 'Install update'
  }).then(() => {
    state.mainWindow.setProgressBar(2)
    autoUpdater.downloadUpdate()
  }, () => {
    log.info('User declined update')
  })
})

autoUpdater.on('download-progress', (eve) => {
  state.mainWindow.setProgressBar(eve.percent / 100)
})

autoUpdater.on('update-downloaded', (eve) => {
  state.mainWindow.setProgressBar(-1)
  new Notification({
    title: "Update is downloaded and ready to install",
    body: `${app.getName()} version ${eve.version} will be automatically installed on exit`
  }).show()
})

autoUpdater.on('error', (eve) => {
  state.mainWindow.setProgressBar(-1)
  error({
    message: 'Update download failed. Please check your internet connection and try again.'
  })
})
