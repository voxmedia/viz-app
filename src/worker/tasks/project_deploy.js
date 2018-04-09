import gulp from 'gulp'
import glob from 'glob'
import path from 'path'
import fs from 'fs'
import { deploy } from 's3-deploy/src/deploy'
import { slugify } from 'underscore.string'

import { expandHomeDir } from '../../lib'

export default function projectDeploy({ project, settings, userData }) {
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

    const cwd = path.join(projectPath, 'ai2html-output')
    if (!fs.existsSync(cwd))
      return reject(`Project ai2html output is missing.\r\n\r\nIt should be here:\r\n${cwd}`)

    const options = {
      bucket: settings.awsBucket, // needed for deleteRemoved
      cwd: path.join(projectPath, 'ai2html-output'),
      filePrefix: `${settings.awsPrefix}/${slugify(project.title.trim())}`,
      deleteRemoved: false,
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

    const globbedFiles = glob.sync(path.join(cwd, '*'))

    if ( settings.awsAccessKeyId ) process.env.AWS_ACCESS_KEY_ID = settings.awsAccessKeyId
    if ( settings.awsSecretAccessKey ) process.env.AWS_SECRET_ACCESS_KEY = settings.awsSecretAccessKey

    deploy(globbedFiles, options, AWSOptions, s3Options, s3ClientOptions).then(() => {
      resolve(project)
    }).catch(err => {
      reject(err)
    })
  })
}
