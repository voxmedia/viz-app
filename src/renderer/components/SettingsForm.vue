<template>
  <form class="settings" @submit="handleSubmit">
    <settings-input name="projectDir" placeholder="Enter a directory path" @input="handleInput" label-cols="6">Default project save location</settings-input>

    <div class="row at-row flex-middle">
      <div class="col-6">
      </div>
      <div class="col-18">
        <at-button @click="handleAi2htmlInstall()" icon="icon-package">{{ai2htmlNeedsInstall() ? 'Install' : (ai2htmlNeedsUpdate() ? 'Update' : 'Reinstall')}} ai2html</at-button>
        <at-tag v-if="ai2htmlNeedsInstall()" color="warning">
          <i class="icon icon-alert-triangle"></i>
          Install needed
        </at-tag>
        <at-tag v-if="ai2htmlNeedsUpdate() && !ai2htmlNeedsInstall()" color="warning">
          <i class="icon icon-alert-triangle"></i>
          Update needed
        </at-tag>
      </div>
    </div>

    <fieldset>
      <legend>Amazon S3 Deployment</legend>

      <!--<p class='hint'>If you leave these blank, the app will attempt find this data in your environment variables</p>-->
      <settings-input name="deployBaseUrl" placeholder="ex. https://apps.voxmedia.com/graphics" @input="handleInput">Public URL for deployed&nbsp;projects</settings-input>
      <settings-input name="awsBucket" placeholder="ex. apps.voxmedia.com" @input="handleInput">AWS Bucket</settings-input>
      <settings-input name="awsPrefix" placeholder="ex. graphics" @input="handleInput">AWS Path in&nbsp;bucket</settings-input>

      <settings-input name="awsRegion" placeholder="ex: us-east-1" @input="handleInput">AWS Region</settings-input>
      <settings-input name="awsAccessKeyId" placeholder="ex: AKIAIOSFODNN7EXAMPLE" @input="handleInput">AWS Access Key&nbsp;ID</settings-input>
      <settings-input type="password" name="awsSecretAccessKey" placeholder="ex: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" @input="handleInput">AWS Secret Access&nbsp;Key</settings-input>

    </fieldset>

    <div class="row at-row flex-middle">
      <div class="col-6">
        <label class="text-right">Fonts and embed customization:</label>
      </div>
      <div class="col-18">
        <at-tag :color="hasSiteConfig ? 'success' : 'warning'">
          <i v-if="!hasSiteConfig" class="icon icon-alert-triangle"></i>
          <i v-if="hasSiteConfig" class="icon icon-check"></i>
          {{hasSiteConfig ? settings.siteConfigName : 'None'}}
        </at-tag>
      </div>
    </div>

    <div class="row at-row flex-middle">
      <div class="col-6">
      </div>
      <div class="col-18">
        <at-button @click="handleImportSettings" icon="icon-folder">Import {{settingsLabel.toLowerCase()}}</at-button>
        <at-button @click="handleClearSettings" icon="icon-trash">Reset {{settingsLabel.toLowerCase()}}</at-button>
      </div>
    </div>
  </form>
</template>

<script>
  import { mapGetters } from 'vuex'
  import { ipcRenderer } from 'electron'
  import atButton from 'at-ui/src/components/button'
  import SettingsInput from './SettingsInput'
  import SettingsTextarea from './SettingsTextarea'
  import atTag from 'at-ui/src/components/tag'
  import { settingsLabel } from '../../lib'

  const timers = {}

  export default {
    name: 'settings-form',
    components: { atButton, atTag, SettingsInput, SettingsTextarea },
    props: {
      settings: Object
    },
    computed: {
      settingsLabel,
      hasSiteConfig() {
        return !!this.settings.siteConfigName
      },
    },
    methods: {
      handleSubmit(eve) {
        eve.preventDefault()
      },
      ai2htmlNeedsInstall() {
        const hashes = ipcRenderer.sendSync('get-hashes')
        return !hashes.installedHash
      },
      ai2htmlNeedsUpdate() {
        const hashes = ipcRenderer.sendSync('get-hashes')
        return hashes.installedHash != hashes.newHash
      },
      handleInput(eve) {
        console.log('recieve input')
        const val = eve.target.value
        const key = eve.target.name
        const store = this.$store
        if ( timers[key] ) clearTimeout(timers[key])
        timers[key] = setTimeout(() => {
          store.dispatch('set', {key, val})
        }, 500)
      },
      handleAi2htmlInstall(eve) {
        ipcRenderer.send('install-ai2html', {from: 'settings-window'})
      },
      handleImportSettings(eve) {
        ipcRenderer.send('import-settings', {from: 'settings-window'})
      },
      handleClearSettings(eve) {
        ipcRenderer.send('reset-settings', {from: 'settings-window'})
      }
    }
  }
</script>

<style>
.settings {
  margin:20px;
}
label {
  display:block;
}
fieldset {
  padding:12px;
  margin:12px 0;
  border-radius:2px;
}
input[type=text],
input[type=password],
textarea {
  padding:4px;
  width:100%;
}
textarea {
  resize:none;
  height:4rem;
}

label + textarea {
  margin-top:8px;
}
legend {
  font-weight:bold;
}
.row + .row,
.hint + .row,
.row + .hint {
  margin-top:12px;
}
.at-btn { cursor:default; }
</style>
