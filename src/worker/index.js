import tasks from './tasks'

export function done(result) {
  process.send(['done', result])
}

export function fail(error) {
  process.send(['fail', error])
}

process.on('message', ([ task, payload ]) => {
  if ( ! task in tasks ) fail(`${task} is not a task`)
  tasks[task](payload).then(done, fail)
});

process.send('ready');
