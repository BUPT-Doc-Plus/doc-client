<template>
  <div id="root" class="full">
    <el-container
      class="full"
      @mouseup.native="disableResizing"
      @mousemove.native="resizeAside"
    >
      <el-header style="height: 30px" class="header">
        <div>
          <i
            v-if="selected.item && selected.item.children === undefined"
            class="el-icon-circle-close"
            @click="unselectDoc"
          />
          {{
            selected.item
              ? selected.item.label + ` (${top.indicator}) ` + " - "
              : ""
          }}
          {{ userInfo.name }} - Doc+
        </div>
      </el-header>
      <el-container class="full" style="display: flex">
        <div
          :style="`flex: 1; display: flex; max-width: ${aside.width + 50}px;`"
        >
          <el-row class="full" @click="handleClickAside()">
            <el-col class="tool-bar full" style="width: 50px">
              <ToolBar :menu="toolbar.menu" @menuChange="onMenuChange" />
            </el-col>
            <el-col class="full" :span="20">
              <el-aside
                class="aside"
                :style="`width: ${aside.width}px;`"
                @mouseup.native="dropAtRoot"
              >
                <el-row class="full">
                  <el-col class="full">
                    <DragAlong
                      v-if="drag.showAlong"
                      :name="drag.item.label"
                      :x="mouse.x"
                      :y="mouse.y"
                    />
                    <Aside
                      :page="asidePage"
                      ref="aside"
                      @fileSelected="onFileSelected"
                      @fileDragged="onDraggedOrDropped"
                      @fileDropped="onDraggedOrDropped"
                      @resultSelected="onResultSelected"
                      @chatSelected="onChatSelected"
                      @renameComplete="renameComplete"
                    />
                  </el-col>
                </el-row>
              </el-aside>
            </el-col>
          </el-row>
        </div>
        <div class="scale full" style="width: 5px" @mousedown="getStartX"></div>
        <el-main class="main" style="flex: 1; display: flex">
          <Editor
            v-if="
              r &&
              selected.item &&
              selected.type === 'doc' &&
              selected.item.children === undefined
            "
            :doc="selected.item"
            :type="selected.item.type"
          />
          <Chat
            v-if="
              r &&
              selected.item &&
              selected.type === 'chat' &&
              selected.item.children !== undefined
            "
            :message="selected.item"
          />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import Editor from "@/components/Editor";
import Chat from "@/components/Chat";
import ToolBar from "@/components/ToolBar";
import Aside from "@/components/Aside";
import DragAlong from "@/components/DragAlong";
import API from "../biz/API";
import config from "../biz/config";

export default {
  name: "DocManager",
  components: { Editor, ToolBar, Aside, DragAlong, Chat },
  created() {
    if (localStorage.getItem("token") === null) {
      this.$router.push({ path: "/login/" });
      return;
    }
    API.currentUser()
      .then((resp) => {
        this.userInfo.name = resp.data.data.nickname;
      })
      .catch((err) => {
        this.$router.push({ path: "/login/" });
      });
    let width = localStorage.getItem("asideWidth");
    if (width !== null) this.aside.width = parseInt(width);
    window.onmousemove = (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    };
  },
  data() {
    return {
      r: true,
      asidePage: undefined,
      top: {
        indicator: "",
      },
      toolbar: {
        menu: ["folder", "search", "delete", "bell", "setting"],
      },
      mouse: {
        x: 0,
        y: 0,
      },
      userInfo: {
        name: "",
      },
      trees: null,
      drag: {
        folder: null,
        item: null,
        showAlong: false,
      },
      selected: {
        type: "doc",
        item: null,
      },
      aside: {
        startX: 0,
        width: 300,
        resizeEnabled: false,
      },
    };
  },
  methods: {
    _refresh() {
      this.r = false;
      this.$nextTick(() => {
        this.r = true;
      });
    },
    getStartX(e) {
      this.aside.startX = e.screenX;
      this.aside.resizeEnabled = true;
    },
    resizeAside(e) {
      if (!this.aside.resizeEnabled || e.screenX === 0) return;
      this.aside.width += e.screenX - this.aside.startX;
      if (this.aside.width < 300) {
        this.aside.width = 300;
        return;
      } else if (this.aside.width > 700) {
        this.aside.width = 700;
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
      this.selected.item = null;
      if (this.toolbar.menu.indexOf("share") !== -1) {
        this.toolbar.menu.splice(1, 1);
      }
    },
    onFileSelected(selected) {
      this.selected = selected;
      this.selected.type = "doc";
      if (this.selected.item && this.selected.cursor.children === undefined) {
        if (this.toolbar.menu.indexOf("share") === -1) {
          this.toolbar.menu.splice(1, 0, "share");
        }
        let item = this.selected.item;
        if (item.type === "code") {
          let names = item.label.split(".");
          let suffix = names[names.length - 1];
          if (config.suffix[suffix]) suffix = config.suffix[suffix];
          this.top.indicator = suffix + "代码";
        } else {
          this.top.indicator = item.type + "文档";
        }
        this._refresh();
      }
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
      // sortTree(this.trees);
    },
    onResultSelected(folder, item) {
      this.selected.item = item;
      this.selected.type = "doc";
      if (this.toolbar.menu.indexOf("share") === -1) {
        this.toolbar.menu.splice(1, 0, "share");
      }
    },
    onChatSelected(msg) {
      this.selected.item = msg;
      this.selected.type = "chat";
    },
    renameComplete() {
      this._refresh();
    },
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
  left: -2.5px;
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
  color: #aaa;
}
</style>
