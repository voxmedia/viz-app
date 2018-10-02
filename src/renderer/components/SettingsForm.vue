<template>
  <form class="settings" @submit="handleSubmit">
    <settings-input name="projectDir" placeholder="Enter a directory path" @input="handleInput" label-cols="6">Default project save location</settings-input>

    <div class="row at-row flex-middle">
      <div class="col-6">
      </div>
      <div class="col-18">
        <at-button @click="handleAi2htmlInstall" icon="icon-package">Install ai2html</at-button>
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
    <settings-textarea name="extraPreviewCss" placeholder="Insert CSS here" @input="handleInput">Extra CSS to add to the graphics preview. Good for loading custom fonts.</settings-textarea>
    <settings-textarea name="extraEmbedCss" placeholder="Insert CSS here" @input="handleInput">CSS to load custom fonts for the graphic. Or any other custom CSS you want.</settings-textarea>
  </form>
</template>

<script>
  import { mapGetters } from 'vuex'
  import { ipcRenderer } from 'electron'
  import atButton from 'at-ui/src/components/button'
  import SettingsInput from './SettingsInput'
  import SettingsTextarea from './SettingsTextarea'

  const timers = {}

  export default {
    name: 'settings-form',
    components: { atButton, SettingsInput, SettingsTextarea },
    props: {
      settings: Object
    },
    methods: {
      handleSubmit(eve) {
        eve.preventDefault()
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
