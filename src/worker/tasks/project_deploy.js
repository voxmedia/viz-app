import gulp from 'gulp'
import glob from 'glob'
import path from 'path'
import fs from 'fs'
import template from 'gulp-template'
import data from 'gulp-data'
import rename from 'gulp-rename'
import chmod from 'gulp-chmod'
import yaml from 'js-yaml'
import { slugify } from 'underscore.string'
import { deploy } from '../../lib/s3deploy'

import { expandHomeDir, getStaticPath } from '../../lib'
import renderEmbedCode from '../../lib/embed_code'

function projectBuild({ project, settings }) {
  return new Promise((resolve, reject) => {
    const projectPath = expandHomeDir(project.path)
    const dest = path.join(projectPath, 'build')

    if (!fs.existsSync(dest)) fs.mkdirSync(dest)

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

    // files coming from the asar package have effed up permissions
    gulp.src(projectPath + '/ai2html-output/**/*.{png,gif,jpg,jpeg,svg}')
      .pipe(chmod(0o644, 0o755)) // make sure dirs have x bit
      .pipe(gulp.dest(dest))
      .on('end', () => end())
      .on('error', (e) => end(e))

    const configFile = path.join(projectPath, 'src', 'config.yml')
    const contentFile = path.join(projectPath, 'ai2html-output', 'index.html')

    // Template data
    const config = yaml.safeLoad(fs.readFileSync(configFile, 'utf8'))
    const content = fs.readFileSync(contentFile, 'utf8')
    const embed_code = renderEmbedCode({ project, settings })

    let indexTmpl = path.join(projectPath, 'src', 'layout.ejs')
    if ( !fs.existsSync(indexTmpl) )
      indexTmpl = path.join(getStaticPath(), 'project-template', 'src', 'layout.ejs')

    gulp.src(indexTmpl)
      .pipe(data(file => {
        return { config, content, project }
      }))
      .pipe(template())
      .pipe(rename({extname: '.html', basename: 'index'}))
      .pipe(chmod(0o644, 0o755)) // make sure dirs have x bit
      .pipe(gulp.dest(dest))
      .on('end', () => end())
      .on('error', (e) => end(e))

    let previewTmpl = path.join(projectPath, 'src', 'preview.ejs')
    if ( !fs.existsSync(previewTmpl) )
      previewTmpl = path.join(getStaticPath(), 'project-template', 'src', 'preview.ejs')

    gulp.src(previewTmpl)
      .pipe(data(file => {
        return { config, embed_code, project }
      }))
      .pipe(template())
      .pipe(rename({extname: '.html', basename: 'preview'}))
      .pipe(chmod(0o644, 0o755)) // make sure dirs have x bit
      .pipe(gulp.dest(dest))
      .on('end', () => end())
      .on('error', (e) => end(e))
  })
}

export default function projectDeploy({ project, settings }) {
  return new Promise((resolve, reject) => {
    if (settings.deployType !== 's3')
      return reject(`Deploy type ${settings.deployType} is not implemented`)

    if (!settings.deployBaseUrl)
      return reject('Base deploy URL is missing. Please set this in settings.')

    if (!settings.awsRegion)
      return reject('AWS Region is missing. Please set this in settings.')

    if (!settings.awsBucket)
      return reject('AWS S3 bucket is missing. Please set this in settings.')

    if (!settings.awsPrefix)
      return reject('AWS S3 file path is missing. Please set this in settings.')

    if (!settings.awsAccessKeyId && !process.env.AWS_ACCESS_KEY_ID)
      return reject('AWS Access Key ID is missing. Please set this in settings.')

    if (!settings.awsSecretAccessKey && !process.env.AWS_SECRET_ACCESS_KEY)
      return reject('AWS Secret Access Key is missing. Please set this in settings.')

    const projectPath = expandHomeDir(project.path)

    if (!fs.existsSync(projectPath))
      return reject(`Project folder is missing.\r\n\r\nIt should be here:\r\n${projectPath}`)

    if (!fs.existsSync(path.join(projectPath, 'ai2html-output')))
      return reject('Project ai2html output is missing.\r\n\r\nRun ai2html from the File > Scripts menu in Illustrator, then try again.')

    const cwd = path.join(projectPath, 'build')
    const options = {
      bucket: settings.awsBucket, // needed for deleteRemoved
      cwd,
      filePrefix: `${settings.awsPrefix}/${slugify(project.title.trim())}`,
      deleteRemoved: false, // enabling this might delete everything in the bucket
    }

    const AWSOptions = {
      region: settings.awsRegion || process.env.AWS_REGION
    }

    const s3Options = {
      Bucket: settings.awsBucket,
      ContentEncoding: 'gzip',
      CacheControl: 'max-age=60'
    }

    const s3ClientOptions = {}

    if ( settings.awsAccessKeyId )
      process.env.AWS_ACCESS_KEY_ID = settings.awsAccessKeyId
    if ( settings.awsSecretAccessKey )
      process.env.AWS_SECRET_ACCESS_KEY = settings.awsSecretAccessKey

    projectBuild({ project, settings })
      .then(() => {
        const files = glob.sync(path.join(cwd, '*.{gif,jpg,png,svg,html}'))
        return deploy(files, options, AWSOptions, s3Options, s3ClientOptions)
      })
      .then(() => {
        resolve(project)
      }, err => {
        reject(err)
      })

  })
}
