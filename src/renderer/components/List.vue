<template>
  <div class="list">
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
      items: Array
    }
  }
</script>

<style lang="scss">
.list {
  height:calc(100vh - 95px);
  overflow:scroll;
  -webkit-overflow-scrolling:touch;
}

.list > div + div { border-top: 1px solid #efefef; }
</style>
