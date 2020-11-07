<template>
  <div>
    <div class="top-bar">
      <div class="top-title">我的文档</div>
      <div class="top-btns">
        <el-dropdown @command="newDocument">
          <span><i class="el-icon-document-add" /></span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="rich-text">富文本</el-dropdown-item>
            <el-dropdown-item command="markdown">Markdown</el-dropdown-item>
            <el-dropdown-item command="user-define">自定义</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-dropdown>
          <span><i class="el-icon-folder-add" @click="newFolder" /></span>
          <el-dropdown-menu slot="dropdown"> </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>
    <TreeForm
      v-if="r"
      icon="el-icon-notebook-2"
      :folder="trees"
      :select="select"
      :selected="selected.facade"
      :dragging="dragging"
      :dropping="dropping"
      :readyToDrop="readyToDrop"
      :unreadyToDrop="unreadyToDrop"
      :fileOptionCallback="fileOptionCallback"
      :blurRename="blur"
      :options="{
        cut: '剪切,Ctrl+X',
        copy: '复制,Ctrl+C',
        paste: '粘贴,Ctrl+V',
        delete: '删除,Del',
        rename: '重命名,F2',
      }"
    />
  </div>
</template>

<script>
import { folderTree } from "@/entity/trees";
import TreeForm from "@/components/TreeForm";
import sortTree from "@/util/sort";
import hotkeys from 'hotkeys-js';

export default {
  components: { TreeForm },
  created() {
    this.trees = this.sortTree(this.trees);
    document.documentElement.oncontextmenu = (e) => {
      return false;
    };
    hotkeys('ctrl+c,ctrl+v,ctrl+x,del,f2', (e) => {
      let op = null;
      if (e.key === 'c') {
        op = 'copy';
      } else if (e.key === 'x') {
        op = 'cut';
      } else if (e.key === 'v') {
        op = 'paste';
      } else if (e.key === 'Delete') {
        op = 'delete';
      } else if (e.key === 'F2') {
        op = 'rename';
      }
      this.fileOptionCallback(op, this.selected.folder, this.selected.facade);
    });
  },
  data() {
    return {
      showAlongTimeout: null,
      itemToShowTimeout: null,
      r: true,
      clipboard: {
        folder: null,
        item: null,
        cut: false,
      },
      renaming: {
        item: null  
      },
      selected: {
        folder: null,
        doc: null,
        facade: null,
      },
      drag: {
        item: null,
        folder: null,
        showAlong: false,
      },
      rc: {
        x: 0,
        y: 0,
      },
      trees: folderTree,
    };
  },
  methods: {
    _getParent() {
      if (this.selected.facade === null) {
        return this.trees;
      } else if (this.selected.facade.children) {
        return this.selected.facade.children;
      } else {
        return this.selected.folder;
      }
    },
    _refreshTree() {
      this.trees = this.sortTree(this.trees);
      this.r = false;
      this.$nextTick(() => {
        this.r = true;
      });
    },
    handleClickAside() {
      if (this.renaming.item) {
        delete this.renaming.item.renaming;
      }
      this.renaming.item = null;
    },
    select(folder, item) {
      if (item.renaming) return;
      console.log(item.label);
      this.selected.folder = folder;
      item.show = !item.show;
      this.selected.facade = item;
      if (item.children === undefined) {
        this.selected.doc = item;
      }
      this.$emit("fileSelected", this.selected);
    },
    dragging(item, folder) {
      this.drag.item = item;
      this.drag.folder = folder;
      this.$emit("fileDragged", this.drag, this.trees);
      this.showAlongTimeout = setTimeout(() => {
        this.drag.showAlong = true;
      }, 250);
    },
    readyToDrop(item) {
      if (this.drag.item) {
        this.itemToShowTimeouts = setTimeout(() => {
          item.show = true;
        }, 500);
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
      this.$emit("fileDropped", this.drag, this.trees);
      clearTimeout(this.showAlongTimeout);
      this.drag.showAlong = false;
    },
    sortTree(root) {
      return sortTree(root);
    },
    rightClick(item) {
      console.log(item.label);
      return true;
    },
    newDocument(type) {
      if (type === "rich-text") {
        let item = {
          label: "新建富文本",
          type: type,
        };
        this._getParent().push(item);
        this._refreshTree();
      } else if (type === "markdown") {
        let item = {
          label: "新建Markdown",
          type: type,
        };
        this._getParent().push(item);
        this._refreshTree();
      }
    },
    newFolder() {
      let folder = {
        label: "新建文件夹",
        show: false,
        children: [],
      };
      this._getParent().push(folder);
      this._refreshTree();
    },
    fileOptionCallback(op, folder, item) {
      let that = this;
      let fns = {
        cut() {
          if (that.clipboard.item) {
            delete that.clipboard.item.cut;
          }
          that.clipboard.folder = folder;
          that.clipboard.item = item;
          that.clipboard.cut = true;
          item.cut = true;
        },
        copy() {
          that.clipboard.folder = folder;
          that.clipboard.item = item;
        },
        paste() {
          if (that.clipboard.cut) {
            that.clipboard.folder.splice(
              that.clipboard.folder.indexOf(that.clipboard.item),
              1
            );
            that.clipboard.cut = false;
            delete that.clipboard.item.cut;
          }
          if (item.children) {
            item.children.push(that.clipboard.item);
          } else {
            folder.push(that.clipboard.item);
          }
        },
        delete() {
          folder.splice(folder.indexOf(item), 1);
        },
        rename() {
          if (that.renaming.item) {
            delete that.renaming.item.renaming;
          }
          that.renaming.item = item;
          item.renaming = true;
        }
      };
      fns[op]();
      this._refreshTree();
    },
    blur() {
      if (this.renaming.item) {
        delete this.renaming.item.renaming;
        this._refreshTree();
      }
      let s = this.selected;
      s.folder = s.doc = s.facade = null;
    }
  },
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
  font-family: "Consolas";
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
  color: #aaa;
}
</style>