import { ipcRenderer } from 'electron'

export default function ipcPlugin(store) {
  ipcRenderer.on('store-action', (event, arg) => {
    store.dispatch(arg.action, arg.payload)
  })

  ipcRenderer.on('store-replace-state', (event, arg) => {
    store.replaceState( arg )
  })

  store.subscribe((mutation, state) => {
    ipcRenderer.send('store-mutate', { mutation, state: JSON.stringify(state) })
  })

  store.replaceState( ipcRenderer.sendSync('get-state') )
}
