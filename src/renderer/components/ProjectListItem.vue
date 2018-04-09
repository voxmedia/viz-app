<template>
  <div
    :class="classes"
    @contextmenu="handleRightClick"
    @click="handleClick"
    @dblclick="handleDoubleClick"
    >
    <div class="details">
      <h4 :title="project.title">{{ project.title }}</h4>
      <code :title="project.path">{{ project.path }}</code>
      <small v-if="project.deployedDate">Last deployed {{ project.deployedDate }}</small>
    </div>
    <div v-if="icon" class="status">
      <i class="icon" :class="icon" :title="statusTooltip"></i>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'

export default {
  name: 'project-list-item',
  props: {
    project: Object
  },
  computed: {
    icon () {
      switch( this.project.status ) {
        case 'deployed':
          return 'icon-check-circle';
        case 'error':
          return 'icon-alert-circle';
        case 'deploying':
          return 'icon-loader';
        default:
          return false;
      }
    },
    statusTooltip () {
      switch( this.project.status ) {
        case 'deployed':
          return 'Project has been deployed!';
        case 'error':
          return this.project.errorMessage;
        case 'deploying':
          return 'Deploying...';
        default:
          return '';
      }
    },
    classes () {
      let cls = ['project-list-item']
      if ( this.project.focus ) cls.push('focus')
      return cls
    },
  },
  methods: {
    handleRightClick (e) {
      e.preventDefault()
      this.$store.dispatch('project_focus', this.project.id)
      ipcRenderer.send('project-context-menu', this.project)
    },
    handleClick(e) {
      this.$store.dispatch('project_focus', this.project.id)
    },
    handleDoubleClick(e) {
      ipcRenderer.send('project-open-ai', this.project)
    },
  }
}
</script>

<style lang="scss">
.project-list-item {
  display:flex;
  align-items:center;
  padding:12px;

  -webkit-user-select: none;
  cursor:default;

  &.focus {
    background-color:Highlight;
    outline:none;
  }

  code {
    font-size:.8em;
  }

  .details {
    flex-grow:1;
    overflow:hidden;
    white-space:nowrap;
    > * {
      overflow:hidden;
      text-overflow:ellipsis;
      display:block
    }
  }

  .status {
    flex-grow:0;
    flex-shrink:0;
    font-size:20px;
  }

  .icon-check-circle {
    color: #13CE66;
  }

  .icon-alert-circle {
    color: #FF4949;
  }

  .icon-loader {
    display: inline-block;
    line-height: 1;
    animation: spin 1s linear infinite;
  }
}

body.no-focus .project-list-item.focus {
  background: #efefef;
}

@keyframes spin {
  0% { transform: rotate(0); }
  100% { transform: rotate(1turn); }
}
</style>
