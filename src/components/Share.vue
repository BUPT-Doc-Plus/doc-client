<template>
  <div
    class="full"
    v-loading="loading"
    element-loading-text="正在加载"
    element-loading-background="rgba(243, 243, 243, 1)">
    <div class="search-box">
      <el-input v-model="search.keywords" placeholder="搜索协作用户" @input="onSearchInput"></el-input>
    </div>
    <TreeForm
      icon="el-icon-user"
      v-if="r"
      :folder="trees"
      :select="select"
    />
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

export default {
  props: ["doc"],
  components: {
    TreeForm,
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
      }
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
    init(doc) {
      if (doc) {
        Tree.getShare(doc).then((data) => {
          this.trees = data;
          this.trees.children.collaborate.label = `"${doc.label}"的协作者`;
          this.trees.children.read.label = `"${doc.label}"的读者`;
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
      opsFn[op]().then(() => {
        this.init(this.doc);
      })
    },
    onSearchInput() {
      if (this.search.keywords) {
        AuthorAPI.queryAuthors(this.search.keywords).then((resp) => {
          this.trees.children.result.children = [];
          for (let author of resp.data.data) {
            author.label = `${author.nickname}<${author.email}>`;
            author.search = true;
            this.trees.children.result.children.push(author);
          }
          this._refreshTree();
        })
      } else {
        this.trees.children.result.children = [];
      }
    },
    genInviteLink() {
      DocAPI.genInviteLink(this.doc.id, "read").then((resp) => {
        this.link.read = resp.data.data;
        DocAPI.genInviteLink(this.doc.id, "collaborate").then((resp) => {
          this.link.coll = resp.data.data;
          this.loading = false;
        })
      });
    },
    copyLink(link) {
      this.$copyText(link).then(() => {
        this.$message({
          type: "success",
          message: "已复制链接"
        })
      })
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
</style>