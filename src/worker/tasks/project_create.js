import path from 'path'
import fs from 'fs'
import { expandHomeDir, getStaticPath } from '../../lib'

export default function createProject({ project, settings }) {
  return new Promise((resolve, reject) => {
    const projectPath = expandHomeDir(project.path)
    fs.mkdirSync(projectPath)

    const expected = 1
    const errors = []
    let count = 0
    function end(error) {
      if (error) errors.push(error)
      if (++count >= expected) {
        if (errors.length > 0) reject(errors)
        else resolve(project)
      }
    }

    fs.copyFile(
      path.join(getStaticPath(), 'template.ai'),
      path.join(projectPath, project.title + '.ai'),
      end)
  })
}
