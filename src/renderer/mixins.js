import Vue from 'vue'

let tabindex = 1
Vue.mixin({
  methods: {
    tabindex () { return tabindex++ },
    isMac () { return process.platform === 'darwin' },
    notMac () { return process.platform !== 'darwin' },
  }
})
