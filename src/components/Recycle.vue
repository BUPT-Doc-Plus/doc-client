<template>
  <div>
    <div class="top-bar">
      <div class="top-title">回收站</div>
    </div>
    <TreeForm
      icon="el-icon-notebook-2"
      :folder="trees"
      :recycled="true"
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
  components: { TreeForm },
  created() {
    this.trees = Tree.connectTree(1);
  },
  data() {
    return {
      fullTree: null,
      trees: null,
      selectedDoc: null,
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

<style scoped>
.top-bar {
  margin-top: 15px;
  display: flex;
}
.top-bar span {
  display: inline-block;
  margin: 0 5px;
}
.top-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 20px;
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
</style>