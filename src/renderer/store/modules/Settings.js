const state = {
  //  projectDir: '/Users/ryanmark/Projects',
  //  deployBaseUrl: null,
  //  deployType: 's3',
  //  awsBucket: null,
  //  awsPrefix: null,
  //  awsRegion: null,
  //  awsAccessKeyId: null,
  //  awsSecretAccessKey: null,
}

const mutations = {
  SETTINGS_SET ( state, { key, val } ) {
    if ( key in state ) state[key] = val
  },
}

const actions = {
  set ({commit}, { key, val }) {
    commit('SETTINGS_SET', {key, val})
  }
}

export default {
  state,
  mutations,
  actions
}
