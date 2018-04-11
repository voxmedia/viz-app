import fs from 'fs'
import { app } from 'electron'
import { fork } from 'child_process'
import { join } from 'path'
import EventEmitter from 'events'
import state from './index'

const WORKER_USE_LIMIT = 10

let workerPath
if ( process.env.NODE_ENV === 'development' ) {
  workerPath = join(__dirname, '..', '..', 'dist', 'electron', 'worker')
} else {
  // When running in production, we have to copy the worker script to a different
  // location to run. We can't fork it directly.
  const asarPath = join(__dirname, 'worker.js')
  workerPath = join(app.getPath('appData'), 'tmpworker.js')
  fs.writeFileSync(workerPath, fs.readFileSync(asarPath))
}

function createWorker() {
  const workerForkOpts = {}
  if ( process.env.NODE_ENV === 'development' ) {
    workerForkOpts.env = Object.assign({ ELECTRON_STATIC: state.staticPath }, process.env)
  } else {
    // We also need to make sure it knows where the node_modules are
    workerForkOpts.env = Object.assign({ ELECTRON_STATIC: state.staticPath, NODE_PATH: join(__dirname, '..', '..', 'node_modules') }, process.env)
  }

  const proc = fork( workerPath, [], workerForkOpts )
  const emitter = new EventEmitter()
  let status = 'new' // new, ready, working, dead
  let uses = 0

  proc.on('message', (args) => {
    if ( args === 'ready' ) status = 'ready'
    else if ( typeof args === 'object' && ( args[0] === 'done' || args[0] === 'fail' ) ) {
      emitter.emit('job-finish', args[0], args[1])
      if ( uses > WORKER_USE_LIMIT ) proc.kill()
      else status = 'ready'
    } else {
      console.error("Unknown message", args)
    }
  })

  proc.on('exit', (code) => {
    status = 'dead'
  })

  proc.on('error', (err) => {
    console.error('Error in worker', err);
    proc.kill()
    if ( status === 'working' )
      emitter.emit('job-finish', 'fail', err)
  })

  return {
    is(s) {
      const args = Array.prototype.slice.call(arguments)
      return args.reduce((m, s) => m || status === s, false)
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
const workers = []

// state from index.js is undefined on load, so we have to wait till index.js runs
setTimeout(() => { workers.push(createWorker()) }, 0)

// Cleanup dead or broken workers
function cleanup() {
  const idx = []
  for(let i=0; i < workers.length; i++) {
    if (!workers[i].is('dead', 'error')) continue;
    idx.push(i)
  }
  idx.forEach(i => workers.splice(i, 1))
}

// Send a job to a worker to be run
export function run(name, payload) {
  cleanup()

  // Look for a worker to send this job to
  for(let i=0; i < workers.length; i++) {
    const worker = workers[i]
    if (worker.is('ready')) return worker.run(name, payload)
  }

  // We didn't find an availble worker, spawn a new one
  if (workers.length < WORKER_MAX) workers.push(createWorker())

  // Retry this job in 400-600 ms
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(run(name, payload)), 400 + Math.round(Math.random()*200))
  })
}
