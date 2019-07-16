import Vue from 'vue'

const state = {
  //  disableAi2htmlStartupCheck: false,
  //  scriptInstallPath: null,
  //  projectDir: '/Users/ryanmark/Projects',
  //  deployBaseUrl: null,
  //  deployType: 's3',
  //  awsBucket: null,
  //  awsPrefix: null,
  //  awsRegion: null,
  //  awsAccessKeyId: null,
  //  awsSecretAccessKey: null,
  //  siteConfigName: null,
  //  extraPreviewCss: null,
  //  extraEmbedCss: null,
  //  extraEmbedStylesheet: null,
  //  ai2htmlFonts: null,
  //  ai2htmlCredit: null,
  //  oembedProviderName: null,
  //  oembedProviderUrl: null
}

const mutations = {
  SETTINGS_SET ( state, newSettings ) {
    for (const key in newSettings) {
      if ( key in state ) state[key] = newSettings[key]
      else Vue.set(state, key, newSettings[key])
    }
  },
  SETTINGS_RESET ( state, defaults ) {
    for ( const k in state ) {
      if ( k in defaults ) state[k] = defaults[k]
      else state[k] = null
    }
  },
}

const actions = {
  set ({commit}, { key, val }) {
    const args = {}
    args[key] = val
    commit('SETTINGS_SET', args)
  },
  updateSettings ({commit}, newSettings) {
    commit('SETTINGS_SET', newSettings)
  },
  resetSettings ({commit}, defaults) {
    commit('SETTINGS_RESET', defaults)
  }
}

export default {
  state,
  mutations,
  actions
}
