const homedir = process.env[(process.platform == 'win32') ? 'HOMEPATH' : 'HOME'];
export function expandHomeDir (p) {
  if (!p) return p;
  if (process.platform == 'win32') {
    return p.replace('%HOMEPATH%', homedir)
  } else {
    return p.replace(/^~\//, `${homedir}/`)
  }
}

export function compactHomeDir (p) {
  if (!p) return p;
  if (process.platform == 'win32') {
    return p.replace(homedir, '%HOMEPATH%')
  } else {
    return p.replace(homedir, '~')
  }
}
