<template>
  <div class="treebox">
    <ul :class="layer === 0 ? 'tree' : ' tree-inner'">
      <li
        :class="item === selected ? 'itembox-selected' : 'itembox'"
        v-for="(item, idx) in folder"
        :key="idx"
        @mouseleave="unreadyToDrop(item)"
      >
        <span
          class="item"
          @click="select(item)"
          @mousedown="dragging(item, folder)"
          @mouseenter="readyToDrop(item)"
          @mouseup="dropping(item)"
        >
          <span
            v-if="item.children"
            :class="`folder-${item.show ? 1 : 0} folder-state`"
            >&gt;</span
          >
          <span v-else class="file-0 folder-state`"
            ><i class="el-icon-notebook-2"
          /></span>
          {{ item.label }}
        </span>
        <TreeForm
          v-if="item.show"
          :folder="item.children"
          :select="select"
          :dragging="dragging"
          :dropping="dropping"
          :readyToDrop="readyToDrop"
          :unreadyToDrop="unreadyToDrop"
          :layer="layer + 1"
          :selected="selected"
        />
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    folder: { required: true },
    select: { required: true },
    selected: { default: null },
    dragging: { required: true },
    dropping: { required: true },
    readyToDrop: { required: true },
    unreadyToDrop: { required: true },
    layer: { default: 0 },
  },
  name: "TreeForm",
  data() {
    return {};
  },
  methods: {},
};
</script>

<style scoped>
.treebox {
  text-align: left;
  margin: 0;
}
.tree-inner {
  border-left: 1px solid #aaa;
  padding-left: 1em;
}
.tree {
  padding-left: 0.5em;
}
.itembox {
  display: block;
  cursor: pointer;
  list-style-type: none;
}
.item {
  user-select: none;
  display: block;
  color: #666;
  font-family: "Consolas";
  background: none;
}
.itembox-selected {
  user-select: none;
  display: block;
  color: #666;
  font-family: "Consolas";
  background: rgba(0, 0, 255, 0.05);
}
.item:hover {
  background: rgba(200, 200, 200, 0.2);
}
.folder-state {
  display: inline-block;
  font-weight: lighter;
  font-size: large;
  color: #888;
  font-family: "Consolas";
}
.folder-0 {
  transform: rotate(0deg);
  transition: 100ms all;
}
.folder-1 {
  transform: rotate(90deg);
  transition: 100ms all;
}
</style>
