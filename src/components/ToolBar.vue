<template>
  <div class="tool-bar full" style="width: 50px">
    <div
      v-for="(sec, i) in menu"
      :key="i"
      :class="'menu-btn' + (sec === selected ? ' menu-btn-enable' : '')"
      @click="onSelect(sec)"
    >
      <div class="circle" v-if="sec === 'chat-line-square' && unread > 0"/>
      <i :class="'el-icon-' + sec" />
    </div>
  </div>
</template>

<script>
export default {
  name: "ToolBar",
  props: ['menu', 'unread'],
  data() {
    return {
      selected: "folder",
    };
  },
  methods: {
    onSelect (sec) {
      this.selected = sec;
      this.$emit('menuChange', sec);
    }
  }
};
</script>

<style>
.menu-btn {
  padding: 11px 0;
  font-size: 27px;
  text-align: center;
  color: rgb(128, 124, 110);
}
.menu-btn:hover {
  color: white;
}
.menu-btn-enable {
  color: white;
  border-left: 2px solid white;
}
.circle {
  position: absolute;
  margin-left: 35px;
  width: 10px;
  height: 10px;
  background: red;
  border-radius: 10px;
}
</style>