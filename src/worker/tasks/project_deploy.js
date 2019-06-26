import glob from 'glob'
import path from 'path'
import fs from 'fs'
import { slugify } from 'underscore.string'
//import { deploy } from '../../lib/s3deploy'
import s3 from 's3-client-control'
import cp from 'glob-copy'

import { expandHomeDir, getStaticPath, getEmbedMeta, getProjectConfig, render } from '../../lib'
import renderEmbedCode from '../../lib/embed_code'

function projectBuild({ project, settings }) {
  return new Promise((resolve, reject) => {
    const projectPath = expandHomeDir(project.path)
    const dest = path.join(projectPath, 'build')

    if (!fs.existsSync(dest)) fs.mkdirSync(dest)

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

    const src = path.join(
      projectPath,
      'ai2html-output',
      '*.{gif,jpg,png,svg,jpeg,json,mp4,mp3,webm,webp}'
    )
    cp(src, dest, end)

    const contentFile = path.join(projectPath, 'ai2html-output', 'index.html')

    // Template data
    const slug = slugify(project.title)
    const deploy_url = `${settings.deployBaseUrl}/${slug}/`
    const config = getProjectConfig(project)
    const content = fs.readFileSync(contentFile, 'utf8')
    const embed_code = renderEmbedCode({ project, settings })
    const embed_meta = getEmbedMeta(config)
    const extra_preview_css = settings.extraPreviewCss || ''
    const extra_embed_css = settings.extraEmbedCss || ''

    fs.writeFile(
      path.join(dest, 'index.html'),
      render('embed.html.ejs', { config, content, project, embed_meta, slug, deploy_url, extra_embed_css }),
      end)

    fs.writeFile(
      path.join(dest, 'preview.html'),
      render('preview.html.ejs', { config, embed_code, project, embed_meta, slug, deploy_url, extra_preview_css }),
      end)

    fs.writeFile(
      path.join(dest, 'embed.js'),
      render('embed.js.ejs', { id: slug + '__graphic', url: deploy_url }),
      end)

    fs.writeFile(
      path.join(dest, 'oembed.json'),
      render('oembed.json.ejs', { config, embed_code, project, embed_meta, slug, deploy_url, settings }),
      end)
  })
}

export default function projectDeploy({ project, settings }) {
  return new Promise((resolve, reject) => {
    if (settings.deployType !== 's3')
      return reject(`Deploy type ${settings.deployType} is not implemented`)

    if (!settings.deployBaseUrl)
      return reject('Base deploy URL is missing. Please set this in settings.')

    if (!settings.awsRegion && !process.env.AWS_REGION)
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

    const localDir = path.join(projectPath, 'build')

    const client = s3.createClient({
      s3Options: {
        region: settings.awsRegion || process.env.AWS_REGION,
        accessKeyId: settings.awsAccessKeyId || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: settings.awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
      }
    })

    const s3Params = {
      Bucket: settings.awsBucket,
      Prefix: `${settings.awsPrefix}/${slugify(project.title.trim())}`,
      CacheControl: 'max-age=60',
      ACL: 'public-read'
    }

    projectBuild({ project, settings })
      .then(() => {
        return new Promise((resolve, reject) => {
          const uploader = client.uploadDir({ localDir, s3Params })
          uploader.on('error', (err) => reject(err))
          uploader.on('end', () => resolve())
        })
      })
      .then(() => {
        resolve(project)
      }, err => {
        reject(err)
      })

  })
}
