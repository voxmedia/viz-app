import { ipcRenderer } from 'electron'
import Vue from 'vue'
import 'at-ui-style/src/index.scss'
//import './assets/base.scss'
import './mixins'

import App from './App'
import Settings from './Settings'
import store from './store'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

//Vue.use(AtComponents)

let app
if ( typeof window !== 'undefined' && window.location.hash === '#settings' ) {
  /* eslint-disable no-new */
  app = new Vue({
    components: { Settings },
    store,
    template: '<Settings/>'
  }).$mount('#app')
} else {
  /* eslint-disable no-new */
  app = new Vue({
    components: { App },
    store,
    template: '<App/>'
  }).$mount('#app')
}

if ( typeof window !== 'undefined' ) {
  window.app = app

  function updateWindowFocus() {
    const hasFocus = ipcRenderer.sendSync('has-focus')
    if ( hasFocus ) {
      let cls = document.body.className
      cls = cls.replace(/no-focus/g, '').trim()
      document.body.className = `${cls} focus`.trim()
    } else {
      let cls = document.body.className
      cls = cls.replace(/focus/g, '').trim()
      document.body.className = `${cls} no-focus`
    }
  }

  window.addEventListener('blur', updateWindowFocus)
  window.addEventListener('focus', updateWindowFocus)
}
