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
        <el-dropdown @command="handleOperation">
          <span><i class="el-icon-menu" /></span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item v-show="!recycled" command="copy" :disabled="multiselect.length === 0">
              <i class="el-icon-document-copy"/>复制
              </el-dropdown-item>
            <el-dropdown-item v-show="!recycled" command="cut" :disabled="multiselect.length === 0">
              <i class="el-icon-scissors"/>剪切
              </el-dropdown-item>
            <el-dropdown-item v-show="!recycled" command="paste" :disabled="clipboard.items.length === 0">
              <i class="el-icon-document"/>粘贴
              </el-dropdown-item>
            <el-dropdown-item v-show="!recycled" command="recycle" :disabled="multiselect.length === 0">
              <i class="el-icon-delete"/>移至回收站
              </el-dropdown-item>
            <el-dropdown-item v-show="recycled" command="restore" :disabled="multiselect.length === 0">
              <i class="el-icon-refresh-left"/>还原
              </el-dropdown-item>
            <el-dropdown-item v-show="recycled" command="delete" :disabled="multiselect.length === 0">
              <i class="el-icon-delete"/>彻底删除
              </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>
    <LoadingBar v-if="loadingTask > 0" index="9999"/>
    <div style="overflow: scroll; height: 96%">
      <TreeForm
        @click.stop.native
        v-if="r"
        icon="el-icon-notebook-2"
        :path="['children']"
        :folder="recycled ? recycleTrees : trees"
        :select="select"
        :selected="selected.cursor"
        :blurRename="blur"
        :recycled="recycled"
      >
        <template slot="before" slot-scope="scope">
          <el-checkbox
            :label="scope.data.item.id !== undefined ? scope.data.item.id : scope.data.idx"
            v-model="scope.data.item.selected"
            @change="handleCheckbox(scope.data.item)"/>
        </template>
        <template slot="after" slot-scope="scope">
          <span v-show="!recycled" class="slot-after">
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
              title="移至回收站"
              @click="singleRecycle(scope.data.item)"/>
          </span>
          <span v-show="recycled" class="slot-after">
            <i
              v-show="!scope.data.item.renaming"
              class="el-icon-refresh-left icon"
              title="还原"
              @click="singleRestore(scope.data.item)"/>
            <i
              v-show="!scope.data.item.renaming"
              class="el-icon-delete icon"
              title="彻底删除"
              @click="singleDelete(scope.data.item)"/>
          </span>
        </template>
        <template slot="rename" slot-scope="scope">
          <el-input
            class="rn-input"
            v-model="renaming.buffer"
            @keydown.enter.native="singleRename(scope.data.item)"
          ></el-input>
        </template>
      </TreeForm>
    </div>
  </div>
</template>

<script>
import TreeForm from "@/components/TreeForm";
import { dfs } from "../file/DocFileSystem";
import { Path } from "../file/Path";
import DocAPI from "../biz/DocAPI";
import API from "../biz/API";
import LoadingBar from "./LoadingBar";
import { UniLMClient } from "../client/UniLMClient";

export default {
  props: ["recycled"],
  components: { TreeForm, LoadingBar },
  created() {
    this.connectToDFS();
    if (this.$route.name === "Invite") {
      let s = setInterval(() => {
        let { docId } = this.$route.params;
        let path = dfs.doc.data.idPath[docId];
        if (path !== undefined) {
          this.select(dfs.get(path));
          clearInterval(s);
        }
      })
    }
  },
  data() {
    return {
      once: {
        selectedDocByRoute: false,
      },
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
      recycleTrees: { children: {} },
      trees: { children: {} },
      loadingFileTree: true,
      loadingTask: 0,
    };
  },
  methods: {
    connectToDFS() {
      this.loadingFileTree = true;
      dfs.close();
      dfs.connect(
        API.user.id,
        () => {
          this.trees = dfs.doc.data.root;
          this.recycleTrees = this.trees.children["-recycled-"] || { children: {} };
          this.selected.cursor = dfs.doc.data.root;
        },
        (op, source) => {
          this.trees = dfs.doc.data.root;
          this.recycleTrees = this.trees.children["-recycled-"] || { children: {} };
          this.$emit("loaded", dfs.doc.data.loaded);
          if (dfs.doc.data.loaded === true) {
            this._refreshTree();
            this.loadingFileTree = false;
            this.connectToNLP();
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
    connectToNLP() {
      UniLMClient.connect();
      UniLMClient.addHandler((data) => {
        let { doc_id, title } = data;
        let path = dfs.doc.data.idPath[doc_id];
        let item = dfs.get(path);
        this.select(item);
        DocAPI.rename(item, title).then((resp) => {
          dfs.rename(path, title, () => {
            this.$emit("renameComplete", item);
            this._refreshTree();
          });
        });
      });
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
      this._refreshTree();
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
      ++this.loadingTask;
      let p;
      if (this.selected.cursor) {
        p = new Path(this.selected.cursor.path);
        if (this.selected.cursor.children === undefined) p = p.parent;
      } else p = new Path("/");
      if (type === "code") {
        let label = "newCode";
        DocAPI.createDoc(label, type, API.user.id).then((resp) => {
          if (resp.data.error === 0) {
            dfs.touch(p.path, resp.data.data, () => {
              --this.loadingTask;
            });
          } else {
            this.$message({
              type: "error",
              message: resp.data.data,
            });
            --this.loadingTask;
          }
        });
      } else {
        let label = "新建文档";
        DocAPI.createDoc(label, type, API.user.id).then((resp) => {
          if (resp.data.error === 0) {
            dfs.touch(p.path, resp.data.data, (path) => {
              let item = dfs.get(path);
              this.select(item);
              --this.loadingTask;
            });
          } else {
            this.$meesage({
              type: "error",
              message: resp.data.data,
            });
            --this.loadingTask;
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
      let label = "新建文件夹";
      dfs.mkdir(p.path + "/" + label, (path) => {
        let item = dfs.get(path);
        this.select(item);
      });
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
      if (this.renaming.item) {
        this.renaming.item.renaming = false;
        this.renaming.item = null;
        this._refreshTree();
      }
    },
    handleCheckbox(item) {
      if (item.selected) {
        this.multiselect.push(item);
      } else {
        this.multiselect.splice(this.multiselect.indexOf(item), 1);
      }
      this._refreshTree();
    },
    batchRecycle() {
      this.$confirm("确认移至回收站?", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.loadingTask += this.multiselect.length;
        this.multiselect.forEach(item => {
          delete item.selected;
          dfs.recycle(item.path, () => {
            if (--this.loadingTask === 0) {
              this.multiselect = [];
              this.$message({
                type: "success",
                message: "已移至回收站"
              });
            }
          });
        })
      })
    },
    singleRecycle(item) {
      this.$confirm("确认移至回收站?", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        ++this.loadingTask;
        dfs.recycle(item.path, () => {
          this.$message({
            type: "success",
            message: "已移至回收站"
          });
          --this.loadingTask;
        });
      })
    },
    batchRestore() {
      this.$confirm("确认全部还原?", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.loadingTask += this.multiselect.length;
        this.multiselect.forEach(item => {
          delete item.selected;
          dfs.restore(item.path, () => {
            if (--this.loadingTask === 0) {
              this.multiselect = [];
              this.$message({
                type: "success",
                message: "已还原"
              });
            }
          });
        })
      })
    },
    singleRestore(item) {
      ++this.loadingTask;
      dfs.restore(item.path, () => {
        this.$message({
          type: "success",
          message: "已还原"
        });
        --this.loadingTask;
      })
    },
    batchDelete() {
      this.$confirm("确认删除?", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.loadingTask += this.multiselect.length;
        DocAPI.batchDelete(
          this.multiselect.filter(e => e.id !== undefined).map(e => e.id))
        .then(() => {
          this.multiselect.forEach(item => {
            delete item.selected;
            dfs.remove(item.path, () => {
              if (--this.loadingTask === 0) {
                this.multiselect = [];
                this.$message({
                  type: "success",
                  message: "删除成功"
                })
              }
            });
          })
        });
      })
    },
    singleDelete(item) {
      this.$confirm("确认删除?", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.loadingTask = 1;
        if (item.id) {
          DocAPI.batchDelete([item.id]).then(() => {
            dfs.remove(item.path, () => {
              this.$message({
                type: "success",
                message: "删除成功"
              });
              this.loadingTask = 0;
            });
          }).catch(() => {
            this.$message({
              type: "error",
              message: "删除失败"
            })
            this.loadingTask = 0;
          })
        } else {
          dfs.remove(item.path, () => {
            this.loadingTask = 0;
            this.$message({
              type: "success",
              message: "删除成功"
            });
          });
        }
      });
    },
    batchCopy() {
      this.clipboard.items = [...this.multiselect];
      for (let item of this.multiselect) {
        delete item.selected;
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
        delete item.selected;
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
        this._refreshTree();
        setTimeout(() => {
          document.querySelector(".rn-input").querySelector("input").focus();
          document.querySelector(".rn-input").querySelector("input").select();
        })
      } else {
        this.loadingTask = 1;
        if (item.children === undefined) {
          DocAPI.rename(item, this.renaming.buffer).then((resp) => {
            dfs.rename(item.path, this.renaming.buffer, () => {
              this.loadingTask = 0;
            });
          });
        } else {
          dfs.rename(item.path, this.renaming.buffer, () => {
            this.loadingTask = 0;
          });
        }
        this.$emit("renameComplete", item);
        this.renaming.item = null;
        item.renaming = false;
        this.select(item);
        this._refreshTree();
      }
    },
    handleOperation(type) {
      if (type === "copy") {
        this.batchCopy();
      } else if (type === "cut") {
        this.batchCut();
      } else if (type === "paste") {
        this.batchPaste();
      } else if (type === "recycle") {
        this.batchRecycle();
      } else if (type === "delete") {
        this.batchDelete();
      } else if (type === "restore") {
        this.batchRestore();
      }
    }
  }
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