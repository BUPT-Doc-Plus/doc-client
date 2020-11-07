<template>
  <div>
    <div class="search-box">
      <el-input v-model="search.keywords" placeholder="搜索协作用户"></el-input>
    </div>
    <TreeForm
      icon="el-icon-user"
      :folder="trees"
      :select="select"
      :options="{invite: '邀请', remove: '移除'}"
      :fileOptionCallback="optionCallback"
    />
  </div>
</template>

<script>
import { shareTree } from '@/entity/trees';
import TreeForm from '@/components/TreeForm';

export default {
  props: ['doc'],
  components: {
    TreeForm
  },
  created () {
    if (this.doc !== null) {
        this.trees = shareTree;
        this.trees[1].label = `"${this.doc.label}"的协作者`;
      } else {
        this.trees = [shareTree[0], {label: '未选择文档', children: [], show: false}];
      }
  },
  data() {
    return {
      trees: shareTree,
      search: {
        keywords: ''
      }
    }
  },
  methods: {
    select(folder, item) {
      item.show = !item.show;
    },
    optionCallback(op, folder, item) {
      
    }
  },
  watch: {
    doc: function (v) {
      if (v !== null) {
        this.trees = shareTree;
        this.trees[1].label = `"${this.doc.label}"的协作者`;
      } else {
        this.trees = [shareTree[0], {label: '未选择文档', children: [], show: false}];
      }
    }
  }
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