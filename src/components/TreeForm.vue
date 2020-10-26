<template>
  <div class="treebox" v-if="r">
    <ul :class="layer === 0 ? 'tree' : ' tree-inner'">
      <li
        :class="item === selected ? 'itembox-selected' : 'itembox'"
        v-for="(item, idx) in folder"
        :key="idx"
        @mouseleave="unreadyToDrop(item)"
      >
        <v-contextmenu
          class="ctx"
          ref="contextmenu"
          @contextmenu="onContextMenu"
        >
          <v-contextmenu-item
            v-for="(op, key) in fileOptions"
            :key="key"
            @click="fileOptionCallback(key, context.folder, context.item)"
            >{{ op }}</v-contextmenu-item
          >
        </v-contextmenu>
        <span
          :class="'item' + (item.cut ? ' item-cut' : '')"
          v-contextmenu:contextmenu
          :data="{ folder, item }"
          @click="select(folder, item)"
          @mousedown="dragging(item, folder)"
          @mouseenter="readyToDrop(item)"
          @mouseup="dropping(item)"
        >
          <span
            v-show="item.children"
            :class="`folder-${item.show ? 1 : 0} folder-state`"
            >&gt;</span
          >
          <div class="fname">
            <span v-show="!item.children" class="file-0 folder-state`"
              ><i class="el-icon-notebook-2"
            /></span>
            <span v-show="!item.renaming">{{ item.label }}</span>
            <span v-show="item.renaming" class="rn-box">
              <el-input
                v-model="item.label"
                @keyup.enter.native="submitRename(item)"
              ></el-input>
            </span>
          </div>
        </span>
        <TreeForm
          v-if="item.show"
          :folder="item.children"
          :select="select"
          :dragging="dragging"
          :dropping="dropping"
          :readyToDrop="readyToDrop"
          :unreadyToDrop="unreadyToDrop"
          :rightClick="rightClick"
          :layer="layer + 1"
          :selected="selected"
          :fileOptionCallback="fileOptionCallback"
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
    rightClick: { required: true },
    layer: { default: 0 },
    fileOptionCallback: { required: true },
  },
  name: "TreeForm",
  data() {
    return {
      r: true,
      fileOptions: {
        cut: "剪切",
        copy: "复制",
        paste: "粘贴",
        delete: "删除",
        rename: "重命名",
      },
      context: {
        folder: null,
        item: null,
      },
    };
  },
  methods: {
    onContextMenu(e) {
      let { item, folder } = e.data.attrs.data;
      console.log(item, folder);
      this.context.folder = folder;
      this.context.item = item;
    },
    submitRename(item) {
      item.renaming = false;
      this.r = false;
      this.$nextTick(() => {
        this.r = true;
      })
    },
  },
};
</script>

<style>
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
.item-cut {
  color: rgba(102, 102, 102, 0.5);
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
.ctx {
  user-select: none;
}
.rn-box {
  display: inline-block;
}
.rn-box input {
  font-family: "Consolas";
  font-size: 16px;
}
.el-input__inner {
  border-radius: 0;
  padding: 0;
  margin: 0;
  height: 100%;
  width: 100%;
}
.fname {
  display: inline-block;
}
</style>
