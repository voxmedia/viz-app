<template>
  <div :class="classes" :tabindex="tabindex()" :style="listHeight" @focus="handleFocus" @blur="handleBlur">
    <div v-for="item in items">
      <project-list-item :project="item"></project-list-item>
    </div>
  </div>
</template>

<script>
  import ProjectListItem from './ProjectListItem'

  export default {
    name: 'list',
    components: { ProjectListItem },
    props: {
      items: Array,
    },
    computed: {
      listHeight() {
        let toolbarHeight = 73
        if ( this.isMac() ) toolbarHeight = 95
        return `height: calc(100vh - ${toolbarHeight}px)`
      },
      classes() {
        const ret = ['list']
        if ( this.$el && this.$el.hasFocus() ) ret.push['focus']
        return ret
      },
    },
    methods: {
      handleFocus(eve) {
      },
      handleBlur(eve) {
      },
    },
  }
</script>

<style lang="scss">
.list {
  overflow:auto;
  -webkit-overflow-scrolling:touch;
}

.list:focus {
  outline: none;
}

.list > div + div { border-top: 1px solid #efefef; }
</style>
