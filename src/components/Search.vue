<template>
  <div>
    <div class="search-box">
      <el-input v-model="search.keywords" placeholder="搜索文档" @input="onKeywordsChange"></el-input>
    </div>
    <TreeForm
      v-if="r"
      icon="el-icon-notebook-2"
      :folder="trees"
      :select="select"
      :selected="selectedDoc"
    />
  </div>
</template>

<script>
import TreeForm from "@/components/TreeForm";
import DocAPI from '../biz/DocAPI';
import { abs } from '../util/digest';

export default {
  components: {
    TreeForm,
  },
  created () {

  },
  data() {
    return {
      r: true,
      trees: { 
        children: { 
          result: {
            label: "搜索结果",
            show: true,
            children: {} 
          } 
        } 
      },
      search: {
        keywords: '',
        s: null
      },
      selectedDoc: null
    }
  },
  methods: {
    _refreshTree() {
      this.r = false;
      this.$nextTick(() => {
        this.r = true;
      });
    },
    select(item) {
      item.show = !item.show;
      if (!item.children) {
        this.$emit('resultSelected', folder, item);
      }
      this.selectedDoc = item;
    },
    optionCallback(op, folder, item) {
      
    },
    onKeywordsChange() {
      if (this.s) clearTimeout(this.s);
      this.s = setTimeout(() => {
        DocAPI.search(this.search.keywords).then((resp) => {
          this.trees.children.result.children = {};
          for (let doc of resp.data.data) {
            this.trees.children.result.children[abs(doc.label + "-" + doc.id)] = doc;
          }
          this._refreshTree();
        })
      }, 200)
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