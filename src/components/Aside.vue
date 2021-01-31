<template>
  <div class="aside full">
    <Share :doc="selected.item" v-show="page === 'share'" />
    <Search v-show="page === 'search'" @resultSelected="resultSelected"/>
    <Folder
      v-show="page === 'delete' || page === 'folder'"
      :recycled="page === 'delete'"
      @fileSelected="fileSelected"
      @fileDragged="fileDragged"
      @fileDropped="fileDropped"
      @renameComplete="renameComplete"
      @loaded="onFolderLoaded"
      @selectedFileClosed="onSelectedFileClosed"
    />
    <Message v-show="page === 'chat-line-square'" @selectChat="chatSelected"/>
    <Settings v-show="page === 'setting'"/>
  </div>
</template>

<script>
import Folder from "@/components/Folder";
import Share from "@/components/Share";
import Search from "@/components/Search";
import Message from "@/components/Message";
import Settings from "@/components/Settings";

export default {
  props: {
    page: {
      default: "folder",
    },
  },
  components: { Folder, Share, Search, Message, Settings },
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
    },
    onSelectedFileClosed() {
      this.$emit("selectedFileClosed");
    }
  },
};
</script>

<style>
</style>
