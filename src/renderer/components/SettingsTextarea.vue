<template>
  <div class="row at-row flex-middle" v-if="name">
  <div class="col-24">
    <label :for="id"><slot>{{label}}</slot></label>
    <textarea
      :name="name"
      :id="id"
      @input="handleInput"
      :placeholder="placeholder"
      >{{val}}</textarea>
  </div>
  </div>
</template>

<script>
  import { humanize, camelize, dasherize } from 'underscore.string'
  export default {
    name: 'settings-textarea',
    props: {
      name: { type: String, required: true },
      placeholder: String,
    },
    computed: {
      id() { return dasherize(this.name) },
      label() { return humanize(this.name) },
      val() { return this.$parent.settings[this.name] },
    },
    methods: {
      handleInput(eve) {
        this.$emit('input', eve)
      }
    }
  }
</script>

<style type="text/scss">
</style>
