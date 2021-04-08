<template>
  <div
    class="full"
    v-loading="loading"
    element-loading-text="正在加载"
    element-loading-background="rgba(243, 243, 243, 1)">
    <LoadingBar v-if="loadingTask > 0" index="9999"/>
    <div class="search-box">
      <el-input v-model="search.keywords" placeholder="搜索协作用户" @input="onSearchInput"></el-input>
    </div>
    <TreeForm
      icon="el-icon-user"
      v-if="r"
      :folder="trees"
      :select="select"
    >
      <template slot="after" slot-scope="scope">
        <span v-if="scope.data.item.id !== undefined">
          <span v-show="getRoleOfItem(scope.data.item) !== 2 && scope.data.item.id !== user.id" class="slot-after">
            <i
              v-show="getRoleOfItem(scope.data.item) !== 1"
              class="el-icon-edit-outline icon"
              title="邀请协作"
              @click="optionCallback('collaborate', scope.data.item)"/>
            <i
              v-show="getRoleOfItem(scope.data.item) !== 0"
              class="el-icon-view icon"
              title="邀请阅读"
              @click="optionCallback('read', scope.data.item)"/>
            <i
              v-show="getRoleOfItem(scope.data.item) !== -1"
              class="el-icon-delete icon"
              title="移除权限"
              @click="optionCallback('remove', scope.data.item)"/>
          </span>
          <span>
            <span v-show="getRoleOfItem(scope.data.item) === 2" class="noop">[创建者]</span>
            <span 
              v-show="getRoleOfItem(scope.data.item) !== 2 && scope.data.item.id === user.id" class="noop">[自己]</span>
          </span>
        </span>
      </template>
    </TreeForm>
    <div>
      <div style="margin: 0.5rem;">
        <el-input v-model="link.read">
          <template slot="prepend">
            只读
          </template>
          <template slot="append">
            <el-button @click="copyLink(link.read)"><i class="el-icon-document-copy"/></el-button>
          </template>
        </el-input>
      </div>
      <div style="margin: 0.5rem;">
        <el-input v-model="link.coll">
          <template slot="prepend">
            协作
          </template>
          <template slot="append">
            <el-button @click="copyLink(link.coll)"><i class="el-icon-document-copy"/></el-button>
          </template>
        </el-input>
      </div>
    </div>
  </div>
</template>

<script>
import Tree from "../entity/Tree";
import TreeForm from "@/components/TreeForm";
import AuthorAPI from "../biz/AuthorAPI";
import DocAPI from "../biz/DocAPI";
import { ChatClient } from '../client/ChatClient';
import API from '../biz/API';
import LoadingBar from "./LoadingBar";

export default {
  props: ["doc"],
  components: {
    TreeForm,
    LoadingBar,
  },
  created() {
    this.user = API.user;
    this.init(this.doc);
  },
  data() {
    return {
      loading: true,
      r: true,
      user: null,
      trees: null,
      search: {
        keywords: "",
      },
      link: {
        read: "",
        coll: "",
      },
      loadingTask: 0,
    };
  },
  methods: {
    _refreshTree() {
      this.init();
      this.r = false;
      this.$nextTick(() => {
        this.r = true;
      });
    },
    init(doc, cache=true, searchCache=null) {
      if (doc && doc.children === undefined) {
        Tree.getShare(doc, cache, searchCache).then((data) => {
          this.trees = data;
          this._refreshTree();
          this.genInviteLink();
        })
      }
    },
    select(item) {
      item.show = !item.show;
    },
    optionCallback(op, item) {
      let opsFn = {
        collaborate: () => {
          ChatClient.send({ receiver: item, sender: this.user, msg: `邀请您加入文档"${this.doc.label}"`, time: Date.now() });
          return DocAPI.invite(this.doc, item, 1).then((resp) => {
            this.$message({
              type: "success",
              message: `成功邀请${item.label}为协作者`
            })
          }).catch((err) => {
            this.$message({
              type: "error",
              message: `邀请失败, ${err.response.data.msg}`
            })
          })
        },
        read: () => {
          return DocAPI.invite(this.doc, item, 0).then((resp) => {
            this.$message({
              type: "success",
              message: `成功邀请${item.label}为读者`
            })
          }).catch((err) => {
            this.$message({
              type: "error",
              message: `邀请失败, ${err.response.data.msg}`
            })
          })
        },
        remove: () => {
          return DocAPI.kick(this.doc, item).then((resp) => {
            this.$message({
              type: "success",
              message: `成功移除${item.label}的权限`
            })
          }).catch((err) => {
            this.$message({
              type: "error",
              message: `移除失败, ${err.response.data.msg}`
            })
          })
        }
      }
      this.loadingTask = 1;
      opsFn[op]().then(() => {
        this.init(this.doc, false, this.trees.children.result.children);
        this.loadingTask = 0;
      })
    },
    onSearchInput() {
      if (this.search.keywords) {
        this.loadingTask = 1;
        AuthorAPI.queryAuthors(this.search.keywords).then((resp) => {
          this.trees.children.result.children = [];
          for (let author of resp.data.data) {
            author.label = `${author.nickname}<${author.email}>`;
            author.search = true;
            this.trees.children.result.children.push(author);
          }
          this.loadingTask = 0;
          this._refreshTree();
        })
      } else {
        this.trees.children.result.children = [];
      }
    },
    genInviteLink(cache=true) {
      if (this.doc !== undefined) {
        let targetId = this.doc.id;
        if (!cache || Tree.linkCache[targetId] === undefined) {
          DocAPI.genInviteLink(this.doc.id, "read").then((resp) => {
            this.link.read = resp.data.data;
            if (this.doc !== undefined) {
              DocAPI.genInviteLink(this.doc.id, "collaborate").then((resp1) => {
                this.link.coll = resp1.data.data;
                this.loading = false;
                Tree.linkCache[targetId] = {
                  read: resp.data.data,
                  coll: resp1.data.data
                }
              })
            }
          });
        } else {
          this.link.read = Tree.linkCache[targetId].read;
          this.link.coll = Tree.linkCache[targetId].coll;
          this.loading = false;
        }
      }
    },
    copyLink(link) {
      this.$copyText(link).then(() => {
        this.$message({
          type: "success",
          message: "已复制链接"
        })
      })
    },
    getRoleOfItem(item) {
      if (this.doc !== undefined) {
        let accs = item.author_accessible.filter(e => e.doc_id == this.doc.id);
        if (accs.length === 0) return -1;
        return accs[0].role;
      }
      return -1;
    }
  },
  watch: {
    doc: function (v) {
      this.init(v);
    },
  },
};
</script>

<style scoped>
.search-box {
  padding: 5px;
}
.search-box .el-input__inner {
  border-radius: 0;
}
.info {
  color: #666;
}
.btns {
  display: flex;
  justify-content: center;
}
.icon {
  cursor: pointer;
}
.icon:hover {
  color: #aaa;
}
.noop {
  font-size: 10px;
}
</style>