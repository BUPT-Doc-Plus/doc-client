<template>
  <div id="root" class="full">
    <el-container
      class="full"
      @mouseup.native="disableResizing"
      @mousemove.native="resizeAside"
    >
      <el-header style="height: 30px" class="header">
        <div>
          <i v-if="selected.doc" class="el-icon-circle-close" @click="unselectDoc"/>
          {{selected.doc ? selected.doc.label + ' - ' : ''}} {{userInfo.name}} - Doc+
        </div>
      </el-header>
      <el-container class="full">
        <el-row class="full">
          <el-col class="tool-bar full" style="width: 50px;">
            <ToolBar @menuChange="onMenuChange"/>
          </el-col>
          <el-col class="full" :span="20">
            <el-aside
              class="aside"
              :style="`width: ${aside.width}px;`"
              @mouseup.native="dropAtRoot"
            >
              <el-row class="full">
                <el-col :style="`width: ${aside.width - 5}px`">
                  <DragAlong v-if="drag.showAlong" :name="drag.item.label" :x="mouse.x" :y="mouse.y" />
                  <Aside
                    :page="asidePage"
                    @fileSelected="onFileSelected"
                    @fileDragged="onDraggedOrDropped"
                    @fileDropped="onDraggedOrDropped"/>
                </el-col>
                <el-col class="scale full" @mousedown.native="getStartX">
                </el-col>
              </el-row>
            </el-aside>
          </el-col>
        </el-row>
        <el-main class="main">
          <Editor
            v-if="selected.doc !== null"
            :doc="selected.doc"
            :type="selected.doc.type"
          />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import TreeForm from "./TreeForm";
import Editor from "./Editor";
import ToolBar from "./ToolBar";
import Aside from "./Aside";
import DragAlong from "./DragAlong";
import sortTree from "../util/sort";

export default {
  name: "DocManager",
  components: { TreeForm, Editor, ToolBar, Aside, DragAlong },
  created() {
    let width = localStorage.getItem("asideWidth");
    if (width !== null) this.aside.width = parseInt(width);
    window.onmousemove = ((e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    })
  },
  data() {
    return {
      asidePage: undefined,
      mouse: {
        x: 0,
        y: 0
      },
      userInfo: {
        name: "测试用户"
      },
      trees: null,
      drag: {
        folder: null,
        item: null,
        showAlong: false,
      },
      selected: {
        doc: null,
        facade: null
      },
      aside: {
        startX: 0,
        width: 250,
        resizeEnabled: false,
      },
    };
  },
  methods: {
    getStartX(e) {
      this.aside.startX = e.screenX;
      this.aside.resizeEnabled = true;
    },
    resizeAside(e) {
      if (!this.aside.resizeEnabled || e.screenX === 0) return;
      this.aside.width += e.screenX - this.aside.startX;
      if (this.aside.width < 250) {
        this.aside.width = 250;
        return;
      } else if (this.aside.width > 750) {
        this.aside.width = 750;
        return;
      }
      this.aside.startX = e.screenX;
    },
    disableResizing(e) {
      this.aside.resizeEnabled = false;
      localStorage.setItem("asideWidth", this.aside.width);
    },
    onMenuChange(sec) {
      this.asidePage = sec;
    },
    unselectDoc() {
      this.selected.doc = null;
    },
    onFileSelected(selected) {
      this.selected = selected;
    },
    onDraggedOrDropped(drag, trees) {
      this.drag = drag;
      this.trees = trees;
    },
    dropAtRoot() {
      if (this.drag.item) {
        this.trees.push(this.drag.item);
        this.drag.folder.splice(this.drag.folder.indexOf(this.drag.item), 1);
      }
      this.drag.showAlong = false;
      this.drag.item = null;
      sortTree(this.trees);
    }
  },
};
</script>

<style scoped>
.header {
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: lighter;
  color: rgb(41, 41, 41);
  background: rgb(221, 221, 221);
}
.main {
  padding: 0;
  margin: 0;
  height: 100%;
}
.aside {
  background: rgb(243, 243, 243);
  height: 100%;
}
.scale {
  cursor: ew-resize;
  width: 5px;
  position: relative;
  left: 2.5px;
}
.tool-bar {
  background: rgb(44, 44, 44);
}
.menu-btn {
  padding: 11px 0;
  font-size: 27px;
  text-align: center;
  color: rgb(128, 124, 110);
}
.menu-btn:hover {
  color: white;
}
.menu-btn-enable {
  color: white;
  border-left: 2px solid white;
}
i:hover {
  cursor: pointer;
  color:#aaa;
}
</style>
