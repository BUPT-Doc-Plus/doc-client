<template>
  <div class="aside full">
    <Folder
      @fileSelected="fileSelected"
      @fileDragged="fileDragged"
      @fileDropped="fileDropped"
      v-show="page === 'folder'"
    />
    <Share v-show="page === 'share'" />
    <div v-show="page === 'search'">搜索</div>
    <div v-show="page === 'delete'">回收站</div>
    <div v-show="page === 'bell'">消息</div>
    <div v-show="page === 'setting'">设置</div>
  </div>
</template>

<script>
import Folder from "@/components/Folder";
import Share from "@/components/Share";

export default {
  props: {
    page: {
      default: "folder",
    },
  },
  components: { Folder, Share },
  created() {
    document.documentElement.oncontextmenu = (e) => {
      return false;
    };
  },
  data() {
    return {};
  },
  methods: {
    fileSelected (selected) {
      this.$emit('fileSelected', selected);
    },
    fileDragged (drag, trees) {
      this.$emit('fileDragged', drag, trees);
    },
    fileDropped (drag, trees) {
      this.$emit('fileDropped', drag, trees);
    },
  },
};
</script>

<style>
</style>