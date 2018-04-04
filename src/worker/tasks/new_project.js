import gulp from 'gulp'
import fs from 'fs'
import { done, fail } from '../index'

export default function newProject(opts) {
  const { projectDir, data } = opts
  fs.mkdirSync(projectDir)

  gulp
    .src(__static + '/project-template/**')
    .pipe(gulp.dest(projectDir))
    .on('end', () => done())
    .on('error', () => fail())
}
