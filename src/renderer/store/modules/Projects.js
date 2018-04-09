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
  PROJECT_STATUS ( state, [id, status] ) {
    const proj = state.find(p => p.id === id)
    proj.status = status
  },
  PROJECT_ERROR ( state, [id, error] ) {
    const proj = state.find(p => p.id === id)
    proj.status = 'error'
    proj.errorMessage = error
  },
  PROJECT_ADD ( state, project ) {
    state.unshift(project)
  },
  PROJECT_UPDATE ( state, [id, data] ) {
    for ( let i=0; i < state.length; i++ ) {
      const p = state[i]
      if ( p.id === id ) {
        for ( let k in data ) {
          if ( ! k in p ) throw new Error(`Invalid project field '${k}'`)
          if ( !_.isEqual(data[k], p[k]) ) p[k] = data[k]
        }
        break
      }
    }
    const proj = state.find(p => p.id === project.id)
  },
  PROJECT_REMOVE ( state, id ) {
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
  project_status ( { commit }, payload ) {
    commit('PROJECT_STATUS', payload)
  },
  project_error ( { commit }, payload ) {
    commit('PROJECT_ERROR', payload)
  },
  project_update ( { commit }, payload ) {
    commit('PROJECT_UPDATE', payload)
  },
  project_create ( { commit }, project ) {
    commit('PROJECT_ADD', project)
  },
  project_remove ( { commit }, id ) {
    commit('PROJECT_REMOVE', id)
  },
}

export default {
  state,
  mutations,
  actions,
  getters
}
