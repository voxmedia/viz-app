<template>
  <button
    class="toolbar-btn"
    @click="handleClick"
    :disabled="disabled"
    type="button"
    :tabindex="tabindex()"
    >
    <i class="icon " :class="icon"></i>
    <span><slot></slot></span>
  </button>
</template>

<script>
  export default {
    name: 'toolbar-button',
    props: {
      icon: String,
      disabled: {
        type: Boolean,
        default: false
      },
    },
    methods: {
      handleClick (evt) {
        evt.preventDefault()
        this.$emit('click', evt)
        this.$el.blur()
      }
    }
  }
</script>

<style lang="scss">
button.toolbar-btn {
  -webkit-appearance: none;
  -webkit-app-region: no-drag;

  border:0;
  background:none;
  color:ButtonText;

  display:flex;
  flex-direction:column;
  align-items:center;

  padding:2px 4px;
  margin:10px;

  &:focus {
    outline:none;
    background-color:Highlight;
    border-radius: 2px;
  }

  &:active {
    opacity:0.6;
  }

  &[disabled] {
    opacity:0.35;
  }

  i {
    font-size: 28px;
  }
  span {
    font: icon;
  }
}
button.toolbar-btn + button.toolbar-btn {
  margin-left:2px;
}
</style>
