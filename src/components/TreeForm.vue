<template>
  <div class="treebox" v-if="r && folder">
    <ul :class="layer === 0 ? 'tree' : ' tree-inner'">
      <li
        :class="item === selected ? 'itembox-selected' : 'itembox'"
        v-for="(item, idx) in folder.children"
        :key="idx"
        @mouseleave="unreadyToDrop ? unreadyToDrop(item) : () => {}"
      >
        <span
          v-if="idx !== '-recycled-'"
          :class="'item' + (item.cut ? ' item-cut' : '')"
          :data="{ item }"
          @click="select(item)"
        >
          <span @click.stop>
            <slot name="before" :data="{ item, idx }"></slot>
            <span @click="select(item)">
              <span
                v-show="item.children"
                :class="`folder-${item.show ? 1 : 0} folder-state`"
                >&gt;</span
              >
              <div class="fname">
                <span v-show="!item.children" class="file-0 folder-state`"
                  ><i :class="item.icon ? item.icon : icon"
                /></span>
                <span v-show="!item.renaming" class="fn-box" :title="item.label">
                  {{ item.label }}
                </span>
                <span v-show="item.renaming" class="rn-box">
                  <slot name="rename" :data="{ item, idx }"></slot>
                </span>
              </div>
            </span>
          </span>
          <span @click.stop style="float: right; padding-right: 10px;">
            <slot name="after" :data="{ item, idx }"></slot>
          </span>
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
          :recycled="recycled"
        >
          <template slot="before" slot-scope="scope">
            <slot
              name="before"
              :data="{ item: scope.data.item, idx: scope.data.idx }"></slot>
          </template>
          <template slot="after" slot-scope="scope">
            <slot
              name="after"
              :data="{ item: scope.data.item, idx: scope.data.idx }"></slot>
          </template>
          <template slot="rename" slot-scope="scope">
            <slot
              name="rename"
              :data="{ item: scope.data.item, idx: scope.data.idx }"></slot>
          </template>
        </TreeForm>
      </li>
    </ul>
    <div v-if="layer === 0" style="height: 2rem"></div>
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
    "recycled",
  ],
  name: "TreeForm",
  data() {
    return {
      r: true,
      m: true,
    };
  },
  methods: {
    _refreshTree() {
      this.r = false;
      this.$nextTick(() => {
        this.r = true;
      });
    },
    _refreshMenu() {
      this.m = false;
      this.$nextTick(() => {
        this.m = true;
      });
    },
    handleCheckbox(item) {
      
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
  padding-left: 9px;
  margin-top: 0;
}
.tree {
  padding-left: 10px;
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
  white-space: nowrap;
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
.fn-box {
  display: inline-block;
  vertical-align: bottom;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
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
.el-checkbox__label {
  display: none;
}
.item:hover .slot-after {
  display: block;
}
.slot-after {
  display: none;
}
</style>
