<template>
  <div :class="classes" :tabindex="tabindex()" @focus="handleFocus" @blur="handleBlur" @drop="handleDrop" @dragover="handleDragOver" @dragleave="handleDragLeave">
    <div class="inner-list" :style="listHeight">
      <div v-for="item in items">
        <project-list-item :project="item"></project-list-item>
      </div>
    </div>
    <div class="drag-cover">
      <i class="icon icon-download"></i>
    </div>
  </div>
</template>

<script>
  import ProjectListItem from './ProjectListItem'
  import {ipcRenderer} from 'electron'

  export default {
    name: 'list',
    components: { ProjectListItem },
    props: {
      items: Array,
    },
    data: () => {
      return {
        dragging: this.dragging,
      }
    },
    computed: {
      listHeight() {
        let toolbarHeight = 73
        if ( this.isMac() ) toolbarHeight = 90.5
        return `height: calc(100vh - ${toolbarHeight}px)`
      },
      classes() {
        const ret = ['list']
        if ( this.dragging ) ret.push('dragging')
        return ret
      },
    },
    methods: {
      handleFocus(eve) { this.$emit('focus', eve) },
      handleBlur(eve) { this.$emit('blur', eve) },
      handleDrop(eve) {
        eve.preventDefault()
        const files = []
        for (const f of eve.dataTransfer.files) files.push(f.path)
        ipcRenderer.send('add-projects', files)
        this.dragging = false
      },
      handleDragOver(eve) {
        this.dragging = true
        eve.preventDefault()
      },
      handleDragLeave(eve) {
        this.dragging = false
        eve.preventDefault()
      },
    },
  }
</script>

<style lang="scss">
.list {
  position:relative;
}

.inner-list {
  overflow:auto;
  -webkit-overflow-scrolling:touch;
}

.list:focus {
  outline: none;
}

.list.dragging .drag-cover {
  display:flex;
}

.drag-cover {
  display:none;
  position:absolute;
  top:0; right:0; bottom:0; left:0;
  background-color:rgba(255,255,255,0.5);
  text-align:center;
  font-size:72px;
  justify-content:center;
  align-items:center;
}

.inner-list > div + div { border-top: 1px solid #efefef; }
</style>
