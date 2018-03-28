import storage from 'electron-json-storage'

const HISTORY_MAX = 20
const SAVE_FILENAME = 'autosave'

const history = []
let index = 0

console.log(`App storage: ${storage.getDefaultDataPath()}`)

function load(cb) {
  storage.get( SAVE_FILENAME, (error, data) => {
    if ( error ) {
      console.error( error )
      if ( cb ) cb(error, null)
      return
    }

    if ( Object.keys(data).length === 0 ) {
      data = require('./defaultState.json')
    }

    history.push(data)
    index = history.length - 1

    if ( cb ) cb(null, data)
  } )
}

function clear(cb) {
  storage.clear((error) => {
    if (error) throw error
    if (cb) cb()
  })
}

function save(state) {
  return storage.set(SAVE_FILENAME, state, (err) => { if (err) throw err })
}

function pushState(state) {
  if ( index < history.length - 1 )
    history.splice( index + 1 )

  history.push( state )
  index = history.length - 1
  save( state )

  if ( HISTORY_MAX > history.length )
    history.splice( 0, history.length - HISTORY_MAX )
}

function state() {
  return history[index]
}

function back() {
  if ( index <= 0 ) return null
  let ret = history[--index]
  save( ret )
  return ret
}

function forward() {
  if ( index >= history.length - 1 ) return null
  let ret = history[++index]
  save( ret )
  return ret
}

export default { load, clear, pushState, state, back, forward }
