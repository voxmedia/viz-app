import path from 'path'
import fs from 'fs'
import { expandHomeDir, getStaticPath, streamCopyFile } from '../../lib'

export default function createProject({ project, settings }) {
  return new Promise((resolve, reject) => {
    const projectPath = expandHomeDir(project.path)
    fs.mkdirSync(projectPath)

    streamCopyFile(
      path.join(getStaticPath(), 'template.ai'),
      path.join(projectPath, project.title + '.ai')
    ).then(resolve).catch(reject)

    streamCopyFile(
      path.join(getStaticPath(), 'template_inquirer.html'),
      path.join(projectPath, 'template_inquirer.html')
    ).then(resolve).catch(reject)
  })
}
