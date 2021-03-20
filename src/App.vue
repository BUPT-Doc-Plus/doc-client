<template>
  <div id="app" class="full">
    <router-view v-if="r"/>
  </div>
</template>

<script>
import API from './biz/API';

export default {
  name: "App",
  provide() {
    return {
      reload: this.reload
    }
  },
  data() {
    return {
      r: true
    }
  },
  methods: {
    reload() {
      this.r = false;
      this.$nextTick(() => {
        this.r = true;
      })
    }
  }
};
</script>

<style>
#app {
  overflow: hidden;
}
h1 {
  font-size: 2em;
}
html,
body {
  margin: 0;
  height: 100%;
}
.full {
  height: 100%;
}
::-webkit-scrollbar {
  /*滚动条整体样式*/
  width: 10px; /*高宽分别对应横竖滚动条的尺寸*/
  height: 1px;
}
::-webkit-scrollbar-thumb {
  /*滚动条里面小方块*/
  border-radius: 10px;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  background: #535353;
}
::-webkit-scrollbar-track {
  /*滚动条里面轨道*/
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  background: #ededed;
}
</style>
