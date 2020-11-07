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
import { recycleTree } from "@/entity/trees";
import TreeForm from "@/components/TreeForm";

export default {
  components: {
    TreeForm,
  },
  created() {},
  data() {
    return {
      trees: recycleTree,
      selectedDoc: null
    };
  },
  methods: {
    select(folder, item) {
      item.show = !item.show;
      if (!item.chilren) {
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