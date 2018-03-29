const state = [
  // {
  //   id: 1,
  //   title: "My project",
  //   path: "/Users/ryanmark/Projects/my-project",
  //   status: "new",
  //   deployedDate: null,
  //   errorMessage: null,
  //   focus: false,
  // },
]

const getters = {
  getById: (state) => (id) => {
    return state.find(p => p.id === id)
  },
  getSelected: (state) => {
    return state.find(p => p.focus)
  },
  hasSelected: (state, getters) => {
    return getters.getSelected != undefined
  },
}

const mutations = {
  PROJECT_FOCUS ( state, id ) {
    const proj = state.find(p => p.id === id)
    proj.focus = true
  },
  PROJECT_BLUR ( state, id ) {
    const proj = state.find(p => p.id === id)
    proj.focus = false
  },
  PROJECT_STATUS ( state, id, status ) {
    const proj = state.find(p => p.id === id)
    proj.status = status
  },
  PROJECT_ADD ( state, project ) {
    // TODO: is this reactive?
    state.unshift(project)
  },
  PROJECT_REMOVE ( state, id ) {
    // TODO: is this reactive?
    const proj = state.find(p => p.id === id)
    const idx = state.indexOf( proj )
    state.splice(idx, 1)
  }
}

const actions = {
  project_focus ( { commit, getters }, id ) {
    if ( getters.getSelected ) commit('PROJECT_BLUR', getters.getSelected.id)
    commit('PROJECT_FOCUS', id)
  },
  project_blur ( { commit, getters } ) {
    if ( getters.getSelected ) commit('PROJECT_BLUR', getters.getSelected.id)
  },
  project_create ( { commit }, project ) {
    commit('PROJECT_ADD', project)
  },
}

export default {
  state,
  mutations,
  actions,
  getters
}
