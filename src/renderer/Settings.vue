<template>
  <div id="settings" @drop="handleDrop" @dragover="handleDragOver">
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
    },
    methods: {
      handleDrop (eve) {
        this.$emit('drop', eve)
        eve.preventDefault()
      },
      handleDragOver (eve) {
        this.$emit('dragover', eve)
        eve.preventDefault()
      },
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
