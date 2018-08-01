import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { template } from 'lodash'
import { slugify } from 'underscore.string'

import { getProjectConfig, render, getEmbedMeta } from './index'

export default function renderEmbedCode({project, settings}) {
  const config = getProjectConfig(project)
  const slug = slugify(project.title)
  const deploy_url = `${settings.deployBaseUrl}/${slug}/`
  const embedMeta = getEmbedMeta(config)
  const fallbacks = embedMeta.fallbacks
  const fallback_img_url = deploy_url + fallbacks[0].name
  const fallback_img_width = fallbacks[0].width
  const fallback_img_height = fallbacks[1].height

  return render('embed_code.html.ejs', {
    slug,
    deploy_url,
    fallback_img_url,
    fallback_img_width,
    fallback_img_height,
    height: embedMeta.height,
    resizable: embedMeta.resizable,
  }).replace(/\s+/g, ' ').trim()
}
