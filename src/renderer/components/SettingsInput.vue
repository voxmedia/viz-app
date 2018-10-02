<template>
  <div class="row at-row flex-middle" v-if="name">
    <div :class="leftClass">
      <label class="text-right" :for="id"><slot>{{label}}</slot></label>
    </div>
    <div :class="rightClass">
      <input
        :name="name"
        :type="type"
        :id="id"
        @input="handleInput"
        :placeholder="placeholder"
        :value="val"
        ></input>
    </div>
  </div>
</template>

<script>
  import { humanize, camelize, dasherize } from 'underscore.string'

  const INPUT_TYPES = [
    'button', 'checkbox', 'color', 'date', 'datetime-local', 'email', 'hidden',
    'image', 'month', 'number', 'password', 'radio', 'range', 'reset',
    'search', 'submit', 'tel', 'text', 'time', 'url', 'week'
  ]

  export default {
    name: 'settings-input',
    props: {
      name: { type: String, required: true },
      type: { type: String, default: 'text', validator: (v) => INPUT_TYPES.includes(v) },
      labelCols: { type: String, default: '8', validator: (v) => !isNaN(Number(v)) },
      placeholder: String,
    },
    computed: {
      id() { return dasherize(this.name) },
      label() { return humanize(this.name) },
      val() { return this.$parent.settings[this.name] },
      leftClass() { return `col-${this.labelCols || 8}` },
      rightClass() { return `col-${24 - (this.labelCols || 8)}` },
    },
    methods: {
      handleInput(eve) {
        this.$emit('input', eve)
      }
    }
  }
</script>

<style type="text/scss">
.text-right { text-align:right; }
</style>
