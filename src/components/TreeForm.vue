<template>
  <div class="treebox" v-if="r && folder">
    <ul :class="layer === 0 ? 'tree' : ' tree-inner'">
      <li
        :class="item === selected ? 'itembox-selected' : 'itembox'"
        v-for="(item, idx) in folder.children"
        :key="idx"
        @mouseleave="unreadyToDrop ? unreadyToDrop(item) : () => {}"
      >
        <v-contextmenu
          class="ctx"
          ref="contextmenu"
          @contextmenu="onContextMenu"
        >
          <v-contextmenu-item
            v-for="(op, key) in options"
            :key="key"
            :disabled="
              (item.joined && key === 'invite') ||
              (!item.joined && key === 'remove')
            "
            @click="fileOptionCallback(key, context.item)"
          >
            <div class="option">
              <div class="option-l">{{ op.split(",")[0] }}</div>
              <div class="option-r">{{ op.split(",")[1] }}</div>
            </div>
          </v-contextmenu-item>
        </v-contextmenu>
        <span
          v-if="!item.nonContext"
          v-contextmenu:contextmenu
          :class="'item' + (item.cut ? ' item-cut' : '')"
          :data="{ item }"
          @click="select(item)"
          @mousedown="dragging ? dragging(item) : () => {}"
          @mouseenter="readyToDrop ? readyToDrop(item) : () => {}"
          @mouseup="dropping ? dropping(item) : () => {}"
        >
          <span
            v-show="item.children"
            :class="`folder-${item.show ? 1 : 0} folder-state`"
            >&gt;</span
          >
          <div class="fname">
            <span v-show="!item.children" class="file-0 folder-state`"
              ><i :class="icon"
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
        <span
          v-if="item.nonContext"
          :class="'item' + (item.cut ? ' item-cut' : '')"
          :data="{ item }"
          @click="select(item)"
          @mousedown="dragging ? dragging(item) : () => {}"
          @mouseenter="readyToDrop ? readyToDrop(item) : () => {}"
          @mouseup="dropping ? dropping(item) : () => {}"
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
          :icon="icon"
          :folder="item"
          :select="select"
          :dragging="dragging"
          :dropping="dropping"
          :readyToDrop="readyToDrop"
          :unreadyToDrop="unreadyToDrop"
          :layer="layer + 1"
          :selected="selected"
          :fileOptionCallback="fileOptionCallback"
          :options="options"
          @renameComplete="renameComplete"
        />
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: [
    "icon",
    "folder",
    "select",
    "selected",
    "dragging",
    "dropping",
    "readyToDrop",
    "unreadyToDrop",
    "layer",
    "fileOptionCallback",
    "options",
  ],
  name: "TreeForm",
  data() {
    return {
      r: true,
      context: {
        folder: null,
        item: null,
      },
    };
  },
  methods: {
    onContextMenu(e) {
      let { item } = e.data.attrs.data;
      this.context.item = item;
    },
    submitRename(item) {
      item.renaming = false;
      this.r = false;
      this.$nextTick(() => {
        this.r = true;
      });
      this.$emit("renameComplete", item);
    },
    renameComplete(item) {
      this.$emit("renameComplete", item);
    }
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
.rn-box .el-input__inner {
  border-radius: 0;
  padding: 0;
  margin: 0;
  height: 100%;
  width: 100%;
}
.fname {
  display: inline-block;
}
.option {
  display: flex;
}
.option-l {
  flex: 1;
  display: flex;
  padding-right: 20px;
  justify-content: flex-start;
}
.option-r {
  flex: 1;
  display: flex;
  padding-left: 20px;
  justify-content: flex-end;
}
</style>
