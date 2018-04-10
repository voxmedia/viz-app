import { template } from 'lodash'

// the webpack 'ejs-loader' does not work
export default template(`
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
