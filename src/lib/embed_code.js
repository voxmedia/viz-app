import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { template } from 'lodash'
import { slugify } from 'underscore.string'

import { expandHomeDir } from './index'

// the webpack 'ejs-loader' does not work
const embedCodeTmpl = template(`
<div data-analytics-viewport="autotune"
     data-analytics-label="<%=slug %>"
     id="<%=slug %>__graphic"
     data-iframe-fallback="<%=fallback_img_url %>"
     data-iframe-fallback-width="<%=fallback_img_width %>"
     data-iframe-fallback-height="<%=fallback_img_height %>"
     data-iframe="<%=deploy_url %>"
     data-iframe-height="<%=height %>"
     <% if ( resizable ) { %>data-iframe-resizable<% } %>></div>
<script type="text/javascript">
(function() {
  var l = function() {
    new pym.Parent(
      '<%=slug %>__graphic',
      '<%=deploy_url %>');
  };
  if(typeof(pym) === 'undefined') {
    var h = document.getElementsByTagName('head')[0],
        s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = 'https://pym.nprapps.org/pym.v1.min.js';
    s.onload = l;
    h.appendChild(s);
  } else {
    l();
  }
})();
</script>`)

export default function renderEmbedCode({project, settings}) {
  const projectPath = expandHomeDir(project.path)
  const configFile = path.join(projectPath, 'config.yml')

  if ( !fs.existsSync(configFile) )
    throw new Error('Missing project config.yml')

  const config = yaml.safeLoad(fs.readFileSync(configFile, 'utf8'))
  const slug = slugify(project.title)
  const deploy_url = `${settings.deployBaseUrl}/${slug}/`
  const fallback_img_url = `${deploy_url}fallback.${config.image_format == 'jpg' ? 'jpg' : 'png'}`
  const fallback_img_width = config.fallback_image_width
  const fallback_img_height = config.fallback_image_height

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

  return embedCodeTmpl({
    slug,
    deploy_url,
    fallback_img_url,
    fallback_img_width,
    fallback_img_height,
    height,
    resizable
  }).replace(/\s+/g, ' ').trim()
}
