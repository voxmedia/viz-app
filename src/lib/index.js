import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'
import { template } from 'lodash'

const HOMEDIR = process.env[process.platform == 'win32' ? 'HOMEPATH' : 'HOME']

export function expandHomeDir (p) {
  if (!p) return p;
  if (process.platform == 'win32') {
    return p.replace('%HOMEPATH%', HOMEDIR)
  } else {
    return p.replace(/^~\//, `${HOMEDIR}/`)
  }
}

export function compactHomeDir (p) {
  if (!p) return p;
  if (process.platform == 'win32') {
    return p.replace(HOMEDIR, '%HOMEPATH%')
  } else {
    return p.replace(HOMEDIR, '~')
  }
}

export function getStaticPath() {
  let ret
  if (process.env.ELECTRON_STATIC)
    return path.resolve(process.env.ELECTRON_STATIC)
  else if (process.env.NODE_ENV !== 'development')
    ret = path.join(__dirname, 'static')
  else
    ret = path.join(__dirname, '..', '..', 'static')
  return ret.replace(/\\/g, '\\\\')
}

export function getEmbedMeta(config) {
  const ext = config.image_format == 'jpg' ? 'jpg' : 'png'
  let fallbacks
  if ( config.fallback_image_height ) {
    fallbacks = [{name: `fallback.${ext}`, width: config.fallback_image_width, height: config.fallback_image_height}]
  } else {
    const artboards = config.artboards.split(',').map(a => a.trim())
    fallbacks = artboards.map((ab) => {
      return {
        name: `fallback-${ab}.${ext}`,
        width: config[`artboard_${ab}_width`],
        height: config[`artboard_${ab}_height`],
        mime: 'image/' + (ext == 'jpg' ? 'jpeg' : 'png')
      }
    }).sort((a, b) => a.width - b.width)
  }

  // collect all the artboard heights from the config file
  const heights = []
  for ( let k in config ) {
    const m = k.match(/^artboard_(.+)_height$/)
    if (m) heights.push(config[k])
  }

  // if all the artboards are the same height, we can just set the height and
  // disable the responsive resizable stuff, set the iframe height to the min height
  let resizable = true
  let height = 150
  if (heights.length > 0) {
    resizable = !heights.every(h => h === heights[0])
    height = Math.min(...heights)
  }

  return { height, resizable, fallbacks }
}

export function getProjectConfig(project) {
  const projectPath = expandHomeDir(project.path)
  const configFile = path.join(projectPath, 'config.yml')
  if ( !fs.existsSync(configFile) )
    throw new Error('Missing project config.yml')

  return yaml.safeLoad(fs.readFileSync(configFile, 'utf8'))
}

const TEMPLATES = []
export function render(tmpl, data) {
  if ( !TEMPLATES[tmpl] )
    TEMPLATES[tmpl] = template(fs.readFileSync(path.join(getStaticPath(), 'templates', tmpl), 'utf8'))
  return TEMPLATES[tmpl](Object.assign({render}, data))
}
