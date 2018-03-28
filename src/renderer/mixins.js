import Vue from 'vue'

let tabindex = 1
Vue.mixin({
  methods: {
    tabindex() {
      return tabindex++
    }
  }
})
