<template>
  <div class="full">
    <div v-show="page === 'folder'">
      <div class="top-bar">
        <div class="top-title">
          我的文档
        </div>
        <div class="top-btns">
          <span><i class="el-icon-document-add" @click="newDocument"/></span>
          <span><i class="el-icon-folder-add" @click="newFolder"/></span>
        </div>
      </div>
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
      showAlongTimeout: null,
      itemToShowTimeout: null,
      selected: {
        doc: null,
        facade: null,
      },
      drag: {
        item: null,
        folder: null,
        showAlong: false,
      },
      trees: trees
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
      this.showAlongTimeout = setTimeout(() => {
        this.drag.showAlong = true;
      }, 250)
    },
    readyToDrop(item) {
      if (this.drag.item) {
        this.itemToShowTimeouts = setTimeout(() => {
          item.show = true;
        }, 500)
      }
    },
    unreadyToDrop(item) {
      clearTimeout(this.itemToShowTimeouts);
    },
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
      clearTimeout(this.showAlongTimeout);
      this.drag.showAlong = false;
      this.$emit('fileDropped', this.drag, this.trees);
    },
    sortTree(root) {
      return sortTree(root);
    },
  }
};
</script>

<style scoped>
.top-bar {
  margin-top: 15px;
  display: flex;
}
.top-bar span {
  display: inline-block;
  margin: 0 5px;
}
.top-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 20px;
  font-family: 'Consolas';
  color: #666;
}
.top-btns {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
i:hover {
  cursor: pointer;
  color:#aaa;
}
</style>