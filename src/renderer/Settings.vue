<template>
  <div id="settings">
    <toolbar>{{settingsLabel}}</toolbar>
    <settings-form :settings="$store.state.Settings"></settings-form>
  </div>
</template>

<script>
  import Toolbar from './components/Toolbar'
  import SettingsForm from './components/SettingsForm'

  export default {
    name: 'settings',
    components: { Toolbar, SettingsForm },
    computed: {
      settingsLabel() {
        return process.platform === 'darwin' ? 'Preferences' : 'Settings'
      }
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
