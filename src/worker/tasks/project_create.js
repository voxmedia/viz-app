import gulp from 'gulp'
import rename from 'gulp-rename'
import fs from 'fs'

export default function createProject({ project, settings }) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(project.path)

    const expected = 2
    const errors = []
    let count = 0
    function end(error) {
      if (error) errors.push(error)
      if (++count >= expected) {
        if (errors.length > 0) reject(errors)
        else resolve(project)
      }
    }

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
