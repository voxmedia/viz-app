import gulp from 'gulp'
import rename from 'gulp-rename'
import fs from 'fs'

export default function createProject({ project, settings }) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(project.path)

    const expected = 3
    const errors = []
    let count = 0
    function end(error) {
      if (error) errors.push(error)
      if (++count >= expected) {
        if (errors.length > 0) reject(errors)
        else resolve(project)
      }
    }

    fs.mkdir(project.path + '/ai2html-output', (err) => {
      if (err) end(err)
      else end()
    })

    gulp.src(__static + '/project-template/template.ai')
      .pipe(rename({basename: project.title}))
      .pipe(gulp.dest(project.path))
      .on('end', () => end())
      .on('error', (e) => end(e))

    gulp.src(__static + '/project-template/src/**')
      .pipe(gulp.dest(project.path + '/src'))
      .on('end', () => end())
      .on('error', (e) => end(e))
  })
}
