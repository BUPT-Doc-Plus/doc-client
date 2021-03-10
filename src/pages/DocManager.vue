<template>
  <div id="root" class="full">
    <transition name="page-fade">
      <el-container
        v-show="loadedFlags.reveal && loadedFlags.ws"
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
                ? (selected.type === "doc" ? selected.item.label + " - " : selected.item.to + " - ")
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
                <ToolBar :menu="toolbar.menu" @menuChange="onMenuChange" :unread="chat.unread"/>
              </el-col>
              <el-col class="full" :span="20">
                <el-aside
                  class="aside"
                  :style="`width: ${aside.width}px;`"
                >
                  <el-row class="full">
                    <el-col class="full">
                      <Aside
                        :page="asidePage"
                        ref="aside"
                        @fileSelected="onFileSelected"
                        @resultSelected="onResultSelected"
                        @chatSelected="onChatSelected"
                        @renameComplete="renameComplete"
                        @loaded="onAsideLoaded"
                        @selectedFileClosed="unselectDoc"
                        @message="onMessageReceived"
                      />
                    </el-col>
                  </el-row>
                </el-aside>
              </el-col>
            </el-row>
          </div>
          <div class="scale full" style="width: 5px" @mousedown="getStartX"></div>
          <el-main class="main" style="flex: 1; display: flex; margin-left: -5px; overflow-y: auto;">
            <Tabs
              :tabs="tabs"
              :active="tabActive"
              @tabSwitch="onTabSwitch"
              @tabClosed="onTabClosed"/>
          </el-main>
        </el-container>
      </el-container>
    </transition>
    <transition name="page-fade">
      <Welcome v-show="!loadedFlags.reveal || !loadedFlags.ws" :percent="loadedFlags.percent"/>
    </transition>
  </div>
</template>

<script>
import Editor from "@/components/Editor";
import Chat from "@/components/Chat";
import ToolBar from "@/components/ToolBar";
import Aside from "@/components/Aside";
import Welcome from "@/components/Welcome";
import Tabs from "@/components/Tabs";
import API from "../biz/API";

export default {
  name: "DocManager",
  components: { Editor, ToolBar, Aside, Chat, Welcome, Tabs },
  provide() {
    return {
      getAsideWidth: () => this.aside.width
    }
  },
  created() {
    if(! ('Notification' in window) ){
		alert('Sorry bro, your browser is not good enough to display notification');
		return;
		}
    if (localStorage.getItem("token") === null) {
      this.$router.push({ path: "/login/" });
      return;
    }
    this.userInfo.name = API.user.nickname;
    this.loadedFlags.reveal = true;
    if (!API.user) {
      this.$router.push({ path: "/login/" });
    }
    let width = localStorage.getItem("asideWidth");
    if (width !== null) this.aside.width = parseInt(width);
    window.onmousemove = (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    };
  },
  data() {
    return {
      wr: true,
      loadedFlags: {
        reveal: false,
        ws: false,
        percent: 0
      },
      r: true,
      asidePage: undefined,
      top: {
        indicator: "",
      },
      toolbar: {
        menu: ["folder", "search", "delete", "chat-line-square", "setting"],
      },
      mouse: {
        x: 0,
        y: 0,
      },
      userInfo: {
        name: "",
      },
      trees: null,
      selected: {
        type: "doc",
        item: null,
      },
      aside: {
        startX: 0,
        width: 300,
        resizeEnabled: false,
      },
      tabActive: 0,
      tabs: {},
      chat: {
        unread: 0
      }
    };
  },
  methods: {
    _refresh() {
      this.r = false;
      this.$nextTick(() => {
        this.r = true;
      });
    },
    _refreshWelcome() {
      this.wr = false;
      this.$nextTick(() => {
        this.wr = true;
      })
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
      // this.selected = selected;
      // this.selected.type = "doc";
      if (selected.item && selected.cursor.children === undefined) {
        this.$set(this, "tabActive", "doc-" + selected.item.id)
        this.$set(this.tabs, "doc-" + selected.item.id, {
          tabType: "doc",
          data: selected.item
        });
        if (this.toolbar.menu.indexOf("share") === -1) {
          this.toolbar.menu.splice(1, 0, "share");
        }
        // let item = this.selected.item;
        // if (item.type === "code") {
        //   let names = item.label.split(".");
        //   let suffix = names[names.length - 1];
        //   if (config.suffix[suffix]) suffix = config.suffix[suffix];
        //   this.top.indicator = suffix + "代码";
        // } else {
        //   this.top.indicator = item.type + "文档";
        // }
        // this._refresh();
      }
    },
    onTabSwitch(k, tabType, id) {
      this.tabActive = k;
    },
    onTabClosed(k, tabType, id) {
      this.$delete(this.tabs, k);
      let keys = Object.keys(this.tabs);
      this.tabActive = keys[keys.length - 1];
      this.$nextTick(() => {
        if (Object.keys(this.tabs).length == 0 && this.toolbar.menu.indexOf("share") !== -1) {
          this.toolbar.menu.splice(1, 1);
        }
      })
    },
    onResultSelected(folder, item) {
      this.selected.item = item;
      this.selected.type = "doc";
      if (this.toolbar.menu.indexOf("share") === -1) {
        this.toolbar.menu.splice(1, 0, "share");
      }
    },
    onChatSelected(msg, unreadDelta) {
      // this.selected.item = msg;
      // this.selected.type = "chat";
      this.chat.unread -= unreadDelta;
      this.$set(this, "tabActive", "chat-" + msg.id)
      this.$set(this.tabs, "chat-" + msg.id, {
        tabType: "chat",
        data: msg
      });
    },
    renameComplete() {
      this._refresh();
    },
    onAsideLoaded(percent) {
      if (percent === true) {
        this.loadedFlags.percent = 100;
        setTimeout(() => {
          this.loadedFlags.ws = true;
        }, 500);
      } else {
        if (percent === undefined) percent = 0;
        this.loadedFlags.percent = Math.round(percent * 100);
      }
    },
    onMessageReceived(data) {
      ++this.chat.unread;
      this._refresh();
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
  user-select: none;
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
.page-fade-enter-active {
  transition: all .5s ease;
}
.page-fade-leave-active {
  transition: all .5s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}
.page-fade-enter, .page-fade-leave-to {
  opacity: 0;
}
</style>
