import Vue from 'vue'
//import AtComponents from 'at-ui'
import 'at-ui-style/src/index.scss'

import App from './App'
import Settings from './Settings'
import store from './store'
import './mixins'

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

if ( typeof window !== 'undefined' ) window.app = app
