<template>
  <div>
    <LoadingBar v-if="loadingTask > 0" index="9999"/>
    <div class="search-box">
      <el-input v-model="search.keywords" placeholder="搜索" @input="onKeywordsChange"></el-input>
    </div>
    <TreeForm
      v-if="r"
      icon="el-icon-notebook-2"
      :folder="trees"
      :select="select"
      :selected="selected.cursor"
    />
  </div>
</template>

<script>
import TreeForm from "@/components/TreeForm";
import DocAPI from '../biz/DocAPI';
import { abs } from '../util/digest';
import LoadingBar from "./LoadingBar";

export default {
  components: {
    TreeForm, LoadingBar
  },
  created () {

  },
  data() {
    return {
      r: true,
      trees: { 
        children: { 
          docs: {
            label: "文档",
            show: true,
            children: {} 
          },
          chats: {
            label: "聊天",
            show: true,
            children: {}
          }
        } 
      },
      search: {
        keywords: '',
        s: null
      },
      selected: {
        cursor: null,
        item: null,
      },
      loadingTask: 0,
    }
  },
  methods: {
    _refreshTree(cb) {
      this.r = false;
      this.$nextTick(() => {
        this.r = true;
        cb();
      });
    },
    select(item) {
      if (item.renaming) return;
      item.show = !item.show;
      this.selected.cursor = item;
      if (item.children === undefined) this.selected.item = item;
      this._refreshTree();
      this.$emit("fileSelected", this.selected);
    },
    onKeywordsChange() {
      if (this.s) clearTimeout(this.s);
      this.loadingTask = 1;
      this.s = setTimeout(() => {
        DocAPI.search(this.search.keywords).then((resp) => {
          this.trees.children.docs.children = {};
          for (let doc of resp.data.data) {
            this.trees.children.docs.children[abs(doc.label + "-" + doc.id)] = doc;
          }
          this.loadingTask = 0;
        })
      });
    }
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