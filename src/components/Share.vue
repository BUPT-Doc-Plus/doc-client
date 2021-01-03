<template>
  <div>
    <div class="search-box">
      <el-input v-model="search.keywords" placeholder="搜索协作用户" @input="onSearchInput"></el-input>
    </div>
    <TreeForm
      icon="el-icon-user"
      v-if="r"
      :folder="trees"
      :select="select"
      :options="{ collaborate: '设为协作者', read: '设为读者', remove: '移除所有权限'}"
      :fileOptionCallback="optionCallback"
    />
  </div>
</template>

<script>
import Tree from "../entity/Tree";
import TreeForm from "@/components/TreeForm";
import AuthorAPI from "../biz/AuthorAPI";
import DocAPI from "../biz/DocAPI";

export default {
  props: ["doc"],
  components: {
    TreeForm,
  },
  created() {
    this.init(this.doc);
  },
  data() {
    return {
      r: true,
      trees: null,
      search: {
        keywords: "",
      },
    };
  },
  methods: {
    _refreshTree() {
      // this.trees = sortTree(this.trees);
      this.init();
      this.r = false;
      this.$nextTick(() => {
        this.r = true;
      });
    },
    init(doc) {
      if (doc !== null) {
        Tree.getShare(doc, this.trees ? this.trees.children.result.children : undefined).then((data) => {
          this.trees = data;
          this.trees.children.collaborate.label = `"${doc.label}"的协作者`;
          this.trees.children.read.label = `"${doc.label}"的读者`;
          this._refreshTree();
        })
      }
    },
    select(item) {
      item.show = !item.show;
    },
    optionCallback(op, item) {
      let opsFn = {
        collaborate: () => {
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
    }
  },
  watch: {
    doc: function (v) {
      this.init(v);
    },
  },
};
</script>

<style>
.search-box {
  padding: 5px;
}
.search-box .el-input__inner {
  border-radius: 0;
}
</style>