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
      :path="['children']"
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
import Tree from "../entity/Tree";
import TreeForm from "@/components/TreeForm";
import hotkeys from "hotkeys-js";
import sortTree from "../util/sort";
import findBinary from "../util/findBinary";

let conn = Tree.connectDocument(1);
let doc = conn.get("tree-document", "1");

export default {
  components: { TreeForm },
  created() {
    doc.subscribe((err) => {
      if (err) throw err;
      this.fullTree = doc.data;
      this.trees = this.fullTree.children;
      this._refreshTree();
    });
    document.documentElement.oncontextmenu = (e) => {
      return false;
    };
    hotkeys("ctrl+c,ctrl+v,ctrl+x,del,f2", (e) => {
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
      this.fileOptionCallback(
        op,
        this.selected.folder,
        this.selected.facade,
        this.selected.path
      );
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
        folder: null,
        doc: null,
        facade: null,
        path: null,
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
      fullTree: null,
      trees: null,
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
    _getParentPath() {
      if (this.selected.facade === null) {
        return ["children"];
      } else if (this.selected.facade.children) {
        return [
          ...this.selected.path,
          this.selected.folder.indexOf(this.selected.facade),
          "children",
        ];
      } else {
        return this.selected.path;
      }
    },
    _getFolderOfPath(path) {
      let res = this.fullTree;
      for (let p of path) res = res[p];
      return res;
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
    select(folder, item, path) {
      if (item.renaming) return;
      this.selected.folder = folder;
      item.show = !item.show;
      this.selected.facade = item;
      if (item.children === undefined) {
        this.selected.doc = item;
      }
      this.selected.path = path;
      this.$emit("fileSelected", this.selected);
    },
    dragging(item, folder, path) {
      this.drag.item = item;
      this.drag.folder = folder;
      this.drag.path = path;
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
    dropping(item, path) {
      if (item === "root") {
        if (this.drag.item) {
          this.trees.push(this.drag.item);
          this.drag.folder.splice(this.drag.folder.indexOf(this.drag.item), 1);
        }
      } else if (item.children && this.drag.item && item !== this.drag.item) {
        doc.submitOp([
          {
            p: [
              ...path,
              this._getFolderOfPath(path).indexOf(item),
              "children",
              findBinary(
                item.children,
                this.drag.item,
                0,
                item.children.length
              ),
            ],
            li: this.drag.item,
          },
          {
            p: [
              ...this.drag.path,
              this.drag.folder.indexOf(this.drag.item)
            ],
            ld: this.drag.item
          }
        ]);
        // item.children.push(this.drag.item);
        // this.drag.folder.splice(this.drag.folder.indexOf(this.drag.item), 1);
      }
      this.drag.item = null;
      // this.trees = this.sortTree(this.trees);
      this.$emit("fileDropped", this.drag, this.trees);
      clearTimeout(this.showAlongTimeout);
      this.drag.showAlong = false;
    },
    rightClick(item) {
      console.log(item.label);
      return true;
    },
    newDocument(type) {
      let item = null;
      if (type === "rich-text") {
        item = new Tree({
          label: "新建富文本",
          type: type,
        });
      } else if (type === "markdown") {
        item = new Tree({
          label: "新建Markdown",
          type: type,
        });
      }
      if (item !== null) {
        // this._getParent().push(item);
        this._refreshTree();
        let path = this._getParentPath();
        let folderOfPath = this._getFolderOfPath(path);
        doc.submitOp({
          p: [...path, findBinary(folderOfPath, item, 0, folderOfPath.length)],
          li: item,
        });
      }
    },
    newFolder() {
      let folder = new Tree({
        label: "新建文件夹",
        show: false,
        children: [],
      });
      this._getParent().push(folder);
      this._refreshTree();
    },
    fileOptionCallback(op, folder, item, path) {
      let that = this;
      let folderOfPath = that._getFolderOfPath(path);
      let fns = {
        cut() {
          if (that.clipboard.item) {
            delete that.clipboard.item.cut;
          }
          that.clipboard.folder = folder;
          that.clipboard.item = item;
          that.clipboard.path = path;
          that.clipboard.cut = true;
          item.cut = true;
        },
        copy() {
          that.clipboard.folder = folder;
          that.clipboard.item = item;
          that.clipboard.path = path;
        },
        paste() {
          if (that.clipboard.cut) {
            // that.clipboard.folder.splice(
            //   that.clipboard.folder.indexOf(that.clipboard.item),
            //   1
            // );
            doc.submitOp({
              p: [
                ...that.clipboard.path,
                that.clipboard.folder.indexOf(that.clipboard.item),
              ],
              ld: that.clipboard.item,
            });
            delete that.clipboard.item.cut;
          }
          if (item.children) {
            // item.children.push(that.clipboard.item);
            doc.submitOp({
              p: [
                ...path,
                folderOfPath.indexOf(item),
                "children",
                findBinary(
                  item.children,
                  that.clipboard.item,
                  0,
                  item.children.length
                ),
              ],
              li: that.clipboard.item,
            });
          } else {
            // folder.push(that.clipboard.item);
            doc.submitOp({
              p: [
                ...path,
                findBinary(
                  folderOfPath,
                  that.clipboard.item,
                  0,
                  folderOfPath.length
                ),
              ],
              li: that.clipboard.item,
            });
          }
        },
        delete() {
          // folder.splice(folder.indexOf(item), 1);
          doc.submitOp({
            p: [...path, folder.indexOf(item)],
            ld: item,
          });
        },
        rename() {
          if (that.renaming.item) {
            delete that.renaming.item.renaming;
          }
          that.renaming.item = item;
          item.renaming = true;
        },
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
i:hover {
  cursor: pointer;
  color: #aaa;
}
</style>