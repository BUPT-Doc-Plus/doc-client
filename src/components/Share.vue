<template>
  <div>
    <div class="search-box">
      <el-input v-model="search.keywords" placeholder="搜索协作用户"></el-input>
    </div>
    <TreeForm
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
  components: {
    TreeForm
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
    select(item) {
      console.log(item);
    },
    optionCallback(op, folder, item) {
      
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