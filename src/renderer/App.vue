<template>
  <div id="app">
    <toolbar>
      Vizier
      <template slot="left">
        <toolbar-button icon="icon-plus-circle" @click="handleNew">New</toolbar-button>
        <toolbar-button icon="icon-upload-cloud" @click="handleDeploy" :disabled="!hasSelected">Deploy</toolbar-button>
      </template>
      <template slot="right">
        <toolbar-button icon="icon-settings" @click="handleSettings">{{settingsLabel}}</toolbar-button>
      </template>
    </toolbar>
    <list :items="$store.state.Projects"></list>
  </div>
</template>

<script>
  import Toolbar from './components/Toolbar'
  import List from './components/List'
  import ToolbarButton from './components/ToolbarButton'
  import { mapGetters } from 'vuex'
  import { ipcRenderer } from 'electron'

  export default {
    name: 'vizier',
    components: { Toolbar, List, ToolbarButton },
    methods: {
      handleNew (eve) {
        ipcRenderer.send('new-project')
      },
      handleDeploy (eve) {
        // TODO: this doesn't work with with using focus state in the list
        ipcRenderer.send('deploy-project')
      },
      handleSettings (eve) {
        ipcRenderer.send('settings')
      }
    },
    computed: {
      settingsLabel() {
        return this.isMac() ? 'Preferences' : 'Settings'
      },
      ...mapGetters(['hasSelected'])
    }
  }
</script>

<style>
  body {
    font: caption;
    overflow:hidden;
  }
  /* CSS */
</style>
