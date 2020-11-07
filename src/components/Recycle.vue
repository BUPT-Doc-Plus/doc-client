<template>
  <div>
    <TreeForm
      icon="el-icon-notebook-2"
      :folder="trees"
      :select="select"
      :selected="selectedDoc"
      :fileOptionCallback="optionCallback"
    />
  </div>
</template>

<script>
import Tree from "../entity/Tree";
import TreeForm from "@/components/TreeForm";

export default {
  components: {
    TreeForm,
  },
  created() {
    this.fullTree = Tree.getRecycled(null);
    this.trees = this.fullTree.children;
  },
  data() {
    return {
      fullTree: null,
      trees: null,
      selectedDoc: null
    };
  },
  methods: {
    select(folder, item) {
      item.show = !item.show;
      if (!item.children) {
        this.$emit("resultSelected", folder, item);
      }
      this.selectedDoc = item;
    },
    optionCallback(op, folder, item) {},
  },
};
</script>

<style>
</style>