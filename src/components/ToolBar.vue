<template>
  <div class="tool-bar full" style="width: 50px">
    <div
      v-for="(sec, i) in menu"
      :key="i"
      :class="'menu-btn' + (sec === selected ? ' menu-btn-enable' : '')"
      @click="onSelect(sec)"
    >
      <i :class="'el-icon-' + sec" />
    </div>
  </div>
</template>

<script>
export default {
  name: "ToolBar",
  data() {
    return {
      menu: ["folder", "share", "search", "delete", "bell", "setting"],
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
</style>