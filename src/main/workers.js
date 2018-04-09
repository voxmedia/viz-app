import { fork } from 'child_process'
import { join } from 'path'
import EventEmitter from 'events'

const workerPath = process.env.NODE_ENV === 'development'
  ? join(__dirname, '..', '..', 'dist', 'electron', 'worker')
  : join(__dirname, '..', 'worker')

const WORKER_USE_LIMIT = 10

function createWorker() {
  console.log(`Forking worker from module ${workerPath}`)
  const proc = fork( workerPath )
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
const workers = [createWorker()]

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
