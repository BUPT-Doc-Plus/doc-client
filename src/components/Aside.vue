<template>
  <div class="full">
    <div v-show="page === 'folder'">
      <TreeForm
        :folder="trees"
        :select="select"
        :selected="selected.facade"
        :dragging="dragging"
        :dropping="dropping"
        :readyToDrop="readyToDrop"
        :unreadyToDrop="unreadyToDrop"
      />
    </div>
    <div v-show="page === 'search'">搜索</div>
    <div v-show="page === 'delete'">回收站</div>
    <div v-show="page === 'bell'">消息</div>
    <div v-show="page === 'setting'">设置</div>
  </div>
</template>

<script>
import { trees } from "../entity/trees";
import TreeForm from "./TreeForm";
import sortTree from "../util/sort";

export default {
  props: {
    page: {
      default: 'folder'
    }
  },
  components: { TreeForm },
  created() {
    this.trees = this.sortTree(this.trees);
  },
  data() {
    return {
      selected: {
        doc: null,
        facade: null,
      },
      drag: {
        item: null,
        folder: null,
      },
      trees:trees
    }
  },
  methods: {
    select(item) {
      item.show = !item.show;
      this.selected.facade = item;
      if (item.children === undefined) {
        this.selected.doc = item;
      }
      this.$emit('fileSelected', this.selected);
    },
    dragging(item, folder) {
      this.drag.item = item;
      this.drag.folder = folder;
      this.$emit('fileDragged', this.drag, this.trees);
    },
    readyToDrop(item) {
      if (this.drag.item) {
        item.show = true;
      }
    },
    unreadyToDrop(item) {},
    dropping(item) {
      if (item === "root") {
        if (this.drag.item) {
          this.trees.push(this.drag.item);
          this.drag.folder.splice(this.drag.folder.indexOf(this.drag.item), 1);
        }
      } else if (item.children && this.drag.item && item !== this.drag.item) {
        item.children.push(this.drag.item);
        this.drag.folder.splice(this.drag.folder.indexOf(this.drag.item), 1);
      }
      this.drag.item = null;
      this.trees = this.sortTree(this.trees);
      this.$emit('fileDropped', this.drag, this.trees);
    },
    sortTree(root) {
      return sortTree(root);
    },
  }
};
</script>

<style>
</style>