<template>
  <div class="aside full">
    <Folder
      @fileSelected="fileSelected"
      @fileDragged="fileDragged"
      @fileDropped="fileDropped"
      @renameComplete="renameComplete"
      v-show="page === 'folder'"
      @loaded="onFolderLoaded"
    />
    <Share :doc="selected.item" v-show="page === 'share'" />
    <Search v-show="page === 'search'" @resultSelected="resultSelected"/>
    <Recycle v-show="page === 'delete'" @resultSelected="resultSelected"/>
    <Message v-show="page === 'bell'" @selectChat="chatSelected"/>
    <Settings v-show="page === 'setting'"/>
  </div>
</template>

<script>
import Folder from "@/components/Folder";
import Share from "@/components/Share";
import Search from "@/components/Search";
import Recycle from "@/components/Recycle";
import Message from "@/components/Message";
import Settings from "@/components/Settings";

export default {
  props: {
    page: {
      default: "folder",
    },
  },
  components: { Folder, Share, Search, Recycle, Message, Settings },
  created() {
    document.documentElement.oncontextmenu = (e) => {
      return false;
    };
  },
  data() {
    return {
      selected: {
        item: null
      }
    };
  },
  methods: {
    fileSelected (selected) {
      this.selected = selected;
      this.$emit('fileSelected', selected);
    },
    fileDragged (drag, trees) {
      this.$emit('fileDragged', drag, trees);
    },
    fileDropped (drag, trees) {
      this.$emit('fileDropped', drag, trees);
    },
    resultSelected(folder, item) {
      this.$emit('resultSelected', folder, item);
    },
    chatSelected(msg) {
      this.$emit('chatSelected', msg);
    },
    renameComplete(item) {
      let newItem = {};
      Object.assign(newItem, item);
      this.selected.item = newItem;
      this.$emit("renameComplete");
    },
    onFolderLoaded(percent) {
      this.$emit("loaded", percent);
    }
  },
};
</script>

<style>
</style>
