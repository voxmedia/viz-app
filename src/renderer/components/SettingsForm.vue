<template>
  <form class="settings" @submit="handleSubmit">
    <div class="row at-row flex-middle">
      <div class="col-6">
        <label for="project-dir">Project folder</label>
      </div>
      <div class="col-18">
        <input
          name="projectDir"
          type="text"
          id="project-dir"
          @input="handleInput"
          placeholder="Enter a directory path"
          :value="settings.projectDir"
        ></input>
      </div>
    </div>

    <fieldset>
      <legend>Amazon S3 Deployment</legend>

      <p class='hint'>If you leave these blank, the app will attempt find this data in your environment variables</p>

      <div class="row at-row flex-middle">
        <div class="col-8">
          <label for="aws-region">AWS Region</label>
        </div>
        <div class="col-16">
          <input
            name="awsRegion"
            type="text"
            id="aws-region"
            @input="handleInput"
            placeholder="ex: us-east-1"
            :value="settings.awsRegion"
          ></input>
        </div>
      </div>

      <div class="row at-row flex-middle">
        <div class="col-8">
          <label for="aws-access-key-id">AWS Access Key&nbsp;ID</label>
        </div>
        <div class="col-16">
          <input
            name="awsAccessKeyId"
            type="text"
            id="aws-access-key-id"
            @input="handleInput"
            placeholder="ex: AKIAIOSFODNN7EXAMPLE"
            :value="settings.awsAccessKeyId"
          ></input>
        </div>
      </div>

      <div class="row at-row flex-middle">
        <div class="col-8">
          <label for="aws-secret-access-key">AWS Secret Access&nbsp;Key</label>
        </div>
        <div class="col-16">
          <input
            name="awsSecretAccessKey"
            type="password"
            id="aws-secret-access-key"
            @input="handleInput"
            placeholder="ex: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            :value="settings.awsSecretAccessKey"
          ></input>
        </div>
      </div>

    </fieldset>
  </form>
</template>

<script>
  import { mapGetters } from 'vuex'

  const timers = {}

  export default {
    name: 'settings-form',
    props: {
      settings: Object
    },
    methods: {
      handleSubmit(eve) {
        eve.preventDefault()
      },
      handleInput(eve) {
        const val = eve.target.value
        const key = eve.target.name
        const store = this.$store
        if ( timers[key] ) clearTimeout(timers[key])
        timers[key] = setTimeout(() => {
          store.dispatch('set', {key, val})
        }, 300)
      },
    }
  }
</script>

<style>
.settings {
  margin:20px;
}
label {
  text-align:right;
  display:block;
}
fieldset {
  padding:12px;
  margin:12px 0;
  border-radius:2px;
}
input[type=text],
input[type=password] {
  padding:4px;
  width:100%;
}
legend {
  font-weight:bold;
}
.row + .row,
.hint + .row,
.row + .hint {
  margin-top:12px;
}
</style>
