import gulp from 'gulp'
import rename from 'gulp-rename'
import chmod from 'gulp-chmod'
import fs from 'fs'
import { expandHomeDir } from '../../lib'

const __static = process.env.ELECTRON_STATIC

export default function createProject({ project, settings }) {
  return new Promise((resolve, reject) => {
    const projectPath = expandHomeDir(project.path)
    fs.mkdirSync(projectPath)

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
      .pipe(chmod(0o644, 0o755)) // make sure dirs have x bit
      .pipe(gulp.dest(projectPath))
      .on('end', () => end())
      .on('error', (e) => end(e))

    gulp.src(__static + '/project-template/src/**')
      .pipe(chmod(0o644, 0o755)) // make sure dirs have x bit
      .pipe(gulp.dest(projectPath + '/src'))
      .on('end', () => end())
      .on('error', (e) => end(e))
  })
}
