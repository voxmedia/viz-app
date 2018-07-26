import path from 'path'

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
    return process.env.ELECTRON_STATIC
  else if (process.env.NODE_ENV !== 'development')
    ret = path.join(__dirname, 'static')
  else
    ret = path.join(__dirname, '..', '..', 'static')
  return ret.replace(/\\/g, '\\\\')
}
