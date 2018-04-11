import tasks from './tasks'

export function done(result) {
  process.send(['done', result])
}

export function fail(error) {
  let ret = error
  if ( error.message ) {
    ret = `Programming error, please report this.\r\n\r\n${error.name}: ${error.message}`
    console.log(error.stack)
  } else if ( typeof(error) !== 'string' ) {
    console.log(error)
    ret = 'Unknown error occured'
  }
  process.send(['fail', ret])
}

process.on('message', ([ task, payload ]) => {
  if ( ! task in tasks ) fail(`${task} is not a task`)
  try {
    tasks[task](payload).then(done, fail)
  } catch (e) {
    fail(e)
  }
});

process.send('ready');
