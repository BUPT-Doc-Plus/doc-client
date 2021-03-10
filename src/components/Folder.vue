<template>
  <div
    class="full"
    @click="blur"
    v-loading="loadingFileTree"
    element-loading-text="正在刷新"
    element-loading-background="rgba(243, 243, 243, 1)"
    style="overflow: hidden;"
  >
    <div @click.stop class="top-bar" style="height: 30px;">
      <div class="top-title">
        <!-- <el-checkbox v-model="selectAll"/> -->
        <span v-show="!recycled">我的文档</span>
        <span v-show="recycled">回收站</span>
      </div>
      <div class="top-btns">
        <div class="el-dropdown" title="刷新">
          <span><i class="el-icon-refresh" @click="connectToDFS" /></span>
        </div>
        <el-dropdown v-show="!recycled" @command="newDocument">
          <span><i class="el-icon-document-add" /></span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="rich">
              <i class="el-icon-notebook-2"/>富文本
            </el-dropdown-item>
            <el-dropdown-item command="md">
              <i class="el-icon-s-management"/>Markdown
            </el-dropdown-item>
            <el-dropdown-item command="code">
              <i class="el-icon-document"/>代码
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <div v-show="!recycled" class="el-dropdown" title="新建文件夹">
          <span><i class="el-icon-folder-add" @click="newFolder" /></span>
        </div>
        <el-dropdown v-show="!recycled" @command="handleOperation">
          <span><i class="el-icon-menu" /></span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="copy" :disabled="multiselect.length === 0">
              <i class="el-icon-document-copy"/>复制
              </el-dropdown-item>
            <el-dropdown-item command="cut" :disabled="multiselect.length === 0">
              <i class="el-icon-scissors"/>剪切
              </el-dropdown-item>
            <el-dropdown-item command="paste" :disabled="clipboard.items.length === 0">
              <i class="el-icon-document"/>粘贴
              </el-dropdown-item>
            <el-dropdown-item command="delete" :disabled="multiselect.length === 0">
              <i class="el-icon-delete"/>删除
              </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>
    <div style="overflow: scroll; height: 96%">
      <TreeForm
        @click.stop.native
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
        :blurRename="blur"
      >
        <template slot="before" slot-scope="scope">
          <el-checkbox
            :label="scope.data.item.id !== undefined ? scope.data.item.id : scope.data.idx"
            v-model="scope.data.item.selected"
            @change="handleCheckbox(scope.data.item)"/>
        </template>
        <template slot="after" slot-scope="scope">
          <span class="slot-after" v-show="scope.data.item.showAfterSlot">
            <i
              v-show="!scope.data.item.renaming"
              class="el-icon-edit icon"
              title="重命名"
              @click="singleRename(scope.data.item)"/>
            <i
              v-show="scope.data.item.renaming"
              class="el-icon-check icon"
              title="提交重命名"
              @click="singleRename(scope.data.item)"/>
            <i
              v-show="scope.data.item.renaming"
              class="el-icon-close icon"
              title="放弃重命名"
              @click="cancelRename"/>
            <i
              v-show="!scope.data.item.renaming"
              class="el-icon-delete icon"
              title="删除"
              @click="singleDelete(scope.data.item)"/>
          </span>
        </template>
        <template slot="rename" slot-scope="scope">
          <el-input
            v-model="renaming.buffer"
          ></el-input>
        </template>
      </TreeForm>
    </div>
  </div>
</template>

<script>
import Tree from "../entity/Tree";
import TreeForm from "@/components/TreeForm";
import hotkeys from "hotkeys-js";
import { dfs } from "../file/DocFileSystem";
import { Path } from "../file/Path";
import axios from "axios";
import DocAPI from "../biz/DocAPI";
import API from "../biz/API";
import getRecycledFromTree from "../util/recycled";
import { abs } from '../util/digest';
import { countKeyVal } from '../util/tree';

export default {
  props: ["recycled"],
  components: { TreeForm },
  created() {
    this.connectToDFS();
  },
  data() {
    return {
      showAlongTimeout: null,
      itemToShowTimeout: null,
      r: true,
      clipboard: {
        cut: false,
        items: [],
      },
      renaming: {
        item: null,
        buffer: ""
      },
      selected: {
        cursor: null,
        item: null,
      },
      multiselect: [],
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
              this.trees.children[abs(node.label + "-" + node.id)] = node;
            })
          } else {
            this.trees = dfs.doc.data.root;
          }
          this.selected.cursor = dfs.doc.data.root;
        },
        (op, source) => {
          if (this.recycled) {
            getRecycledFromTree(dfs.doc.data.root, (node) => {
              this.trees.children[abs(node.label + "-" + node.id)] = node;
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
            let item = dfs.get(p.path + abs(resp.data.data.label + "-" + resp.data.data.id));
            this.selected.cursor = item;
            this.selected.item = item;
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
      if (p.jpath.length > 18) {
        this.$message({
          type: "error",
          message: "文件夹层数过深"
        })
        return;
      }
      let label = "新建文件夹",
        suffix = 0;
      while (dfs.get(p.path + label) !== undefined) {
        label = "新建文件夹" + "-" + ++suffix;
      }
      dfs.mkdir(p.path + "/" + label);
      let item = dfs.get(p.path + "/" + label);
      this.selected.cursor = item;
      this.selected.item = item;
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
      this.selected.cursor = dfs.doc.data.root;
      this.cancelRename();
    },
    cancelRename() {
      this.renaming.item.renaming = false;
      this.renaming.item = null;
      this._refreshTree();
    },
    handleCheckbox(item) {
      if (item.selected) {
        this.multiselect.push(item);
      } else {
        this.multiselect.splice(this.multiselect.indexOf(item), 1);
      }
    },
    batchDelete() {
      this.$confirm("确认删除?", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        DocAPI.batchDelete(
          this.multiselect.filter(e => e.id !== undefined).map(e => e.id))
        .then(() => {
          this.$message({
            type: "success",
            message: "删除成功"
          })
          for (let item of this.multiselect) {
            dfs.remove(item.path);
          }
        });
      })
    },
    singleDelete(item) {
      this.$confirm("确认删除?", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        if (item.id) {
          DocAPI.batchDelete([item.id]).then(() => {
            this.$message({
              type: "success",
              message: "删除成功"
            });
            dfs.remove(item.path);
          }).catch(() => {
            this.$message({
              type: "error",
              message: "删除失败"
            })
          })
        } else {
          dfs.remove(item.path);
          this.$message({
            type: "success",
            message: "删除成功"
          });
        }
      });
    },
    batchCopy() {
      this.clipboard.items = [...this.multiselect];
      for (let item of this.multiselect) {
        item.selected = false;
      }
      this.multiselect.splice(0, this.multiselect.length);
      this.$message({
        type: "success",
        message: "已复制"
      })
    },
    batchCut() {
      this.clipboard.cut = true;
      this.clipboard.items = [...this.multiselect];
      for (let item of this.multiselect) {
        item.cut = true;
        item.selected = false;
      }
      this.multiselect.splice(0, this.multiselect.length);
      this.$message({
        type: "success",
        message: "已剪切"
      })
    },
    batchPaste() {
      if (this.clipboard.cut) {
        // from cut
        for (let item of this.clipboard.items) {
          item.cut = false;
          dfs.move(item.path, this.selected.cursor.path);
        }
        this.clipboard.cut = false;
      } else {
        
      }
    },
    singleRename(item) {
      if (this.renaming.item !== null && this.renaming.item !== item) {
        this.renaming.item.renaming = false;
        this.renaming.item = null;
      }
      if (!item.renaming) {
        this.renaming.buffer = item.label;
        this.renaming.item = item;
        item.renaming = true;
      } else {
        if (item.children === undefined) {
          DocAPI.rename(item, this.renaming.buffer).then((resp) => {
            dfs.rename(item.path, this.renaming.buffer);
          });
        } else {
          dfs.rename(item.path, this.renaming.buffer);
        }
        this.$emit("renameComplete", item);
        this.renaming.item = null;
        item.renaming = false;
      }
      this._refreshTree();
    },
    handleOperation(type) {
      if (type === "copy") {
        this.batchCopy();
      } else if (type === "cut") {
        this.batchCut();
      } else if (type === "paste") {
        this.batchPaste();
      } else if (type === "delete") {
        this.batchDelete();
      }
    }
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
.icon {
  cursor: pointer;
}
.icon:hover {
  color: #aaa;
}
</style>