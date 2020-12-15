<template>
  <div class="full" @click="blur">
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
      :path="['children']"
      :folder="trees"
      :recycled="false"
      :select="select"
      :selected="selected.cursor"
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
      @renameComplete="renameComplete"
    />
  </div>
</template>

<script>
import Tree from "../entity/Tree";
import TreeForm from "@/components/TreeForm";
import hotkeys from "hotkeys-js";
import sortTree from "../util/sort";
import findBinary from "../util/findBinary";
import { DocFileSystem } from "../file/DocFileSystem";
import { Path } from "../file/Path";

var dfs = new DocFileSystem();

export default {
  components: { TreeForm },
  created() {
    dfs.connect(
      1,
      () => {
        this.trees = dfs.doc.data.root;
        this.selected.cursor = dfs.doc.data.root;
      },
      () => {
        this.trees = dfs.doc.data.root;
        this._refreshTree();
      }
    );
    document.documentElement.oncontextmenu = (e) => {
      return false;
    };
    hotkeys("ctrl+c,ctrl+v,ctrl+x,del,f2", { keyup: true }, (e) => {
      if (e.type === "keyup") {
        let op = null;
        if (e.key === "c") {
          op = "copy";
        } else if (e.key === "x") {
          op = "cut";
        } else if (e.key === "v") {
          op = "paste";
        } else if (e.key === "Delete") {
          op = "delete";
        } else if (e.key === "F2") {
          op = "rename";
        }
        this.fileOptionCallback(op, this.selected.cursor);
      }
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
        path: [],
      },
      renaming: {
        item: null,
      },
      selected: {
        cursor: null,
        item: null,
        lock: false,
      },
      drag: {
        item: null,
        folder: null,
        showAlong: false,
        path: null,
      },
      rc: {
        x: 0,
        y: 0,
      },
      trees: null,
    };
  },
  methods: {
    _refreshTree() {
      // this.trees = sortTree(this.trees);
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
    select(item) {
      console.log(item);
      this.selected.lock = true;
      if (item.renaming) return;
      item.show = !item.show;
      this.selected.cursor = item;
      if (item.children === undefined) this.selected.item = item;
      this.$emit("fileSelected", this.selected);
    },
    dragging(item) {
      this.drag.item = item;
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
        // item.children.push(this.drag.item);
        // this.drag.folder.splice(this.drag.folder.indexOf(this.drag.item), 1);
      }
      this.drag.item = null;
      // this.trees = this.sortTree(this.trees);
      this.$emit("fileDropped", this.drag, this.trees);
      clearTimeout(this.showAlongTimeout);
      this.drag.showAlong = false;
    },
    newDocument(type) {
      let p = new Path(this.selected.cursor.path);
      if (this.selected.cursor.children === undefined) p = p.parent;
      let label = "新建文档",
        suffix = 0;
      while (dfs.get(p.path + label) !== undefined) {
        label = "新建文档" + "-" + ++suffix;
      }
      dfs.touch(p.path, { label, name });
    },
    newFolder() {},
    fileOptionCallback(op, item) {
      let opZhMap = {
        copy: "复制",
        cut: "剪切",
        paste: "粘贴",
        delete: "删除",
      };
      let opFnMap = {
        copy: () => dfs.copy(item.path),
        cut: () => dfs.cut(item.path),
        paste: () => dfs.paste(item.path),
        delete: () => dfs.remove(item.path),
        rename: () => {
          item.renaming = true;
          this._refreshTree();
          return -2;
        },
      };
      let flag = opFnMap[op]();
      console.log(flag);
      if (flag === true || flag === 0 || flag === 1) {
        this.$message({
          message: `${opZhMap[op]}成功`,
          type: "success",
        });
      } else if (flag === false || flag === -1) {
        this.$message({
          message: `${opZhMap[op]}失败`,
          type: "error",
        });
      }
      this._refreshTree();
    },
    renameComplete(item, callback) {
      callback(dfs.rename(item.path, item.label), new Path(item.path).target);
    },
    blur() {
      if (this.selected.lock) this.selected.lock = false;
      else {
        if (this.renaming.item) {
          delete this.renaming.item.renaming;
          this._refreshTree();
        }
        this.selected.cursor = dfs.doc.data.root;
      }
    },
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
.top-btns i:hover {
  cursor: pointer;
  color: #aaa;
}
</style>