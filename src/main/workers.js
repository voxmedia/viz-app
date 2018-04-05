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
  let uses = 0

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
    is(s) {
      return status === s
    },
    on(name, cb) {
      emitter.on(name, cb)
    },
    run(task, payload) {
      if ( status !== 'ready' ) return Promise.reject(new Error('Worker not available'))
      status = 'working'
      uses++
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

const WORKER_MAX = 5
const workers = [createWorker()]

export function run(name, payload) {
  for(let i=0; i < workers.length; i++) {
    const worker = workers[i]
    if(worker.is('ready')) {
      return worker.run(name, payload)
    }
  }

  if (workers.length < WORKER_MAX) workers.push(createWorker())

  setTimeout(() => run(name, payload), 400 + Math.round(Math.random()*200))
}
