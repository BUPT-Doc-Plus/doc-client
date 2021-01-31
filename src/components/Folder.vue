<template>
  <div
    class="full"
    @click="blur"
    v-loading="loadingFileTree"
    element-loading-text="正在刷新"
    element-loading-background="rgba(243, 243, 243, 1)"
    style="overflow: hidden;"
  >
    <div class="top-bar" style="height: 30px;">
      <div class="top-title">
        <span v-show="!recycled">我的文档</span>
        <span v-show="recycled">回收站</span>
      </div>
      <div class="top-btns">
        <div class="el-dropdown">
          <span><i class="el-icon-refresh" @click="connectToDFS" /></span>
        </div>
        <el-dropdown v-show="!recycled" @command="newDocument">
          <span><i class="el-icon-document-add" /></span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="rich">富文本</el-dropdown-item>
            <el-dropdown-item command="md">Markdown</el-dropdown-item>
            <el-dropdown-item command="code">代码</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <div v-show="!recycled" class="el-dropdown">
          <span><i class="el-icon-folder-add" @click="newFolder" /></span>
        </div>
      </div>
    </div>
    <div style="overflow: scroll; height: 96%">
      <TreeForm
        v-if="r"
        icon="el-icon-notebook-2"
        :path="['children']"
        :folder="trees"
        :recycled="recycled"
        :select="select"
        :selected="selected.cursor"
        :dragging="dragging"
        :dropping="dropping"
        :readyToDrop="readyToDrop"
        :unreadyToDrop="unreadyToDrop"
        :fileOptionCallback="fileOptionCallback"
        :blurRename="blur"
        :options="recycled ? contextMenu.recycleOption : contextMenu.folderOption"
        @renameComplete="renameComplete"
      />
    </div>
  </div>
</template>

<script>
import Tree from "../entity/Tree";
import TreeForm from "@/components/TreeForm";
import hotkeys from "hotkeys-js";
import sortTree from "../util/sort";
import findBinary from "../util/findBinary";
import { dfs } from "../file/DocFileSystem";
import { Path } from "../file/Path";
import axios from "axios";
import DocAPI from "../biz/DocAPI";
import API from "../biz/API";
import getRecycledFromTree from "../util/recycled";

export default {
  props: ["recycled"],
  components: { TreeForm },
  created() {
    API.currentUser().then((resp) => {
      this.connectToDFS();
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
      trees: { children: {} },
      loadingFileTree: true,
      contextMenu: {
        folderOption: {
          cut: "剪切,Ctrl+X",
          copy: "复制,Ctrl+C",
          paste: "粘贴,Ctrl+V",
          recycle: "删除,Del",
          rename: "重命名,F2",
        },
        recycleOption: {
          restore: "还原,Ctrl+R",
          delete: "彻底删除,Del",
        }
      }
    };
  },
  methods: {
    connectToDFS() {
      this.loadingFileTree = true;
      dfs.close();
      dfs.connect(
        API.user.id,
        () => {
          if (this.recycled) {
            getRecycledFromTree(dfs.doc.data.root, (node) => {
              this.trees.children[node.label + "-" + node.id] = node;
            })
          } else {
            this.trees = dfs.doc.data.root;
          }
          this.selected.cursor = dfs.doc.data.root;
        },
        (op, source) => {
          if (this.recycled) {
            getRecycledFromTree(dfs.doc.data.root, (node) => {
              this.trees.children[node.label + "-" + node.id] = node;
            })
          } else {
            this.trees = dfs.doc.data.root;
          }
          this.$emit("loaded", dfs.doc.data.loaded);
          if (dfs.doc.data.loaded === true) {
            this._refreshTree();
            this.loadingFileTree = false;
            this.$emit("loaded", true);
          }
          if (this.selected.item && dfs.doc.data.idPath[this.selected.item.id] === undefined) {
            this.$emit("selectedFileClosed")
          }
        },
        () => {
          this.loadingFileTree = true;
        }
      );
    },
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
      let p;
      if (this.selected.cursor) {
        p = new Path(this.selected.cursor.path);
        if (this.selected.cursor.children === undefined) p = p.parent;
      } else p = new Path("/");
      if (type === "code") {
        let label = "newCode";
        DocAPI.createDoc(label, type, API.user.id).then((resp) => {
          if (resp.data.error === 0) {
            dfs.touch(p.path, resp.data.data);
            // let item = dfs.get(p.path + resp.data.data.label + "-" + resp.data.data.id);
            // this.selected.cursor = item;
            // this.selected.item = item;
            // this.fileOptionCallback("rename", item);
          } else {
            this.$meesage({
              type: "error",
              message: resp.data.data,
            });
          }
        });
      } else {
        let label = "新建文档";
        DocAPI.createDoc(label, type, API.user.id).then((resp) => {
          if (resp.data.error === 0) {
            dfs.touch(p.path, resp.data.data);
            let item = dfs.get(p.path + resp.data.data.label + "-" + resp.data.data.id);
            this.selected.cursor = item;
            this.selected.item = item;
            this.fileOptionCallback("rename", item);
          } else {
            this.$meesage({
              type: "error",
              message: resp.data.data,
            });
          }
        });
      }
    },
    newFolder() {
      let p;
      if (this.selected.cursor) {
        p = new Path(this.selected.cursor.path);
        if (this.selected.cursor.children === undefined) p = p.parent;
      } else p = new Path("/");
      let label = "新建文件夹",
        suffix = 0;
      while (dfs.get(p.path + label) !== undefined) {
        label = "新建文件夹" + "-" + ++suffix;
      }
      dfs.mkdir(p.path + "/" + label);
      let item = dfs.get(p.path + "/" + label);
      this.selected.cursor = item;
      this.selected.item = item;
      this.fileOptionCallback("rename", item);
    },
    fileOptionCallback(op, item, suppressPrompt = false) {
      if (item === undefined) return;
      let opZhMap = {
        copy: "复制",
        cut: "剪切",
        paste: "粘贴",
        recycle: "删除",
        delete: "删除",
        restore: "还原"
      };
      let opFnMap = {
        copy: () => dfs.copy(item.path),
        cut: () => dfs.cut(item.path),
        paste: () => dfs.paste(item.path),
        recycle: () => {
          if (item.children !== undefined) {
            for (let key in item.children) {
              this.fileOptionCallback("recycle", item.children[key], true);
            }
          }
          return dfs.recycle(item.path)
        },
        rename: () => {
          item.renaming = true;
          this._refreshTree();
          return -2;
        },
        restore: () => dfs.restore(item.path),
        delete: () => {
          // 递归删除
          if (item.children === undefined) {
            DocAPI.remove(item, API.user.id);
          } else {
            for (let key in item.children) {
              this.fileOptionCallback("delete", item.children[key], true);
            }
          }
          return dfs.remove(item.path);
        },
      };
      if (op === "recycle" && !suppressPrompt) {
        this.$confirm(`确定将"${item.label}"移至回收站?`, "删除", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }).then(() => {
          let flag = opFnMap[op]();
          if (!suppressPrompt) {
            if (flag) {
              this.$message({
                message: `${opZhMap[op]}成功`,
                type: "success",
              });
            } else {
              this.$message({
                message: `${opZhMap[op]}失败`,
                type: "error",
              });
            }
          }
          this._refreshTree();
        });
      } else if (op === "delete" && !suppressPrompt) {
        this.$confirm(`确定删除"${item.label}"? 该操作不可逆!`, "危险行为", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }).then(() => {
          let flag = opFnMap[op]();
          if (!suppressPrompt) {
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
          }
          this._refreshTree();
        });
      } else {
        let flag = opFnMap[op]();
        if (!suppressPrompt) {
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
        }
        this._refreshTree();
      }
    },
    renameComplete(item) {
      if (item.children === undefined) {
        DocAPI.rename(item, item.label).then((resp) => {
          dfs.rename(item.path, item.label);
        });
      } else {
        dfs.rename(item.path, item.label), new Path(item.path).target;
      }
      this.$emit("renameComplete", item);
    },
    blur() {
      if (this.selected.lock) this.selected.lock = false;
      else {
        if (this.renaming.item) {
          delete this.renaming.item.renaming;
          this._refreshTree();
        }
        dfs.doc.fetch((err) => {
          if (err) throw err;
          this.selected.cursor = dfs.doc.data.root;
        })
      }
    },
  },
};
</script>

<style scoped>
.top-bar {
  display: flex;
  border-bottom: 1px solid rgba(102, 102, 102, .1);
}
.top-bar span {
  display: inline-block;
  margin: 0 5px;
}
.top-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 10px;
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