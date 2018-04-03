import { fork } from 'child_process'
import { join } from 'path'
import EventEmitter from 'events'

const workerPath = process.env.NODE_ENV === 'development'
  ? join(__dirname, '..', '..', 'dist', 'electron', 'worker')
  : join(__dirname, '..', 'worker')

function createWorker() {
  console.log(`Forking worker from module ${workerPath}`)
  const proc = fork( workerPath )
  const emitter = new EventEmitter()
  let status = 'new' // new, ready, working, done, error, dead

  proc.on('message', (args) => {
    if ( args === 'ready' ) status = 'ready'
    else if ( typeof args === 'object' && ( args[0] === 'done' || args[0] === 'fail' ) ) {
      emitter.emit('job-finish', args[0], args[1])
      status = 'ready'
    } else {
      console.error("Unknown message", args)
    }
  })

  proc.on('exit', (code) => {
    status = 'dead'
  })

  proc.on('error', (err) => {
    status = 'error'
    console.error('Error in worker', err);
  })

  return {
    on(name, cb) {
      emitter.on(name, cb)
    },
    run(task, payload) {
      if ( status !== 'ready' ) return Promise.reject(new Error('Worker not available'))
      status = 'working'

      const ret = new Promise((resolve, reject) => {
        emitter.once('job-finish', (res, data) => {
          if ( res === 'done' ) resolve(data)
          else if ( res === 'fail' ) reject(data)
        })
      })

      proc.send([task, payload])

      return ret
    },
  }
}

const worker = createWorker()

export function run(name, payload) {
  return worker.run(name, payload)
}
