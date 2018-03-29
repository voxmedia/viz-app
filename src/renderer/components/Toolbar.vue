<template>
  <nav class="toolbar" @click="handleClick">
    <div class="title-bar" v-if="isMac()"><slot>Vizier</slot></div>
    <div class="tools" v-if="hasToolSlots">
      <div><slot name="left"></slot></div>
      <div><slot name="right"></slot></div>
    </div>
  </nav>
</template>

<script>
  export default {
    name: 'toolbar',
    //components: { },
    methods: {
      handleClick (eve) {
        this.$emit('click', eve)
      },
    },
    computed: {
      hasToolSlots() {
        return this.$slots.left || this.$slots.right
      },
    },
  }
</script>

<style lang="scss">
.toolbar {
  -webkit-user-select: none;
  -webkit-app-region: drag;

  border-bottom: 0.5px solid WindowFrame;

  .title-bar {
    padding:3px;
    font: caption;
    text-align:center;
  }
  .tools,
  .tools > div {
    display:flex;
    justify-content:space-between;
    align-items:stretch;
  }
}

body.no-focus .toolbar .title-bar { opacity:0.5; }
</style>
