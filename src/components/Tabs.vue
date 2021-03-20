<template>
  <el-container class="root">
      <el-header
        class="tab-container"
        style="display: flex;
               width: 100%;
               height: 30px;
               border-left: 1px solid rgba(102, 102, 102, .1);
               background: rgb(243, 243, 243);
               padding: 0;">
        <div
          v-for="(tab, k) in tabs"
          :key="k"
          :class="'tab' + (k == active ? ' active' : '')"
          @click="switchTab(k, tab.tabType, tab.data.id)">
          <span class="info">
            <span v-if="tab && tab.tabType === 'doc'">
              <i class="el-icon-notebook-2"/>
              {{ tab.data.label }}
            </span>
            <span v-if="tab && tab.tabType === 'chat'">
              <i class="el-icon-chat-line-square"/>
              {{ theOther(tab.data.initiator, tab.data.recipient) }}
            </span>
          </span>
          <span class="ops"><i class="el-icon-close" @click="closeTab(k, tab.tabType, tab.data.id)"/></span>
        </div>
      </el-header>
      <el-main style="padding: 0;">
        <Editor
          v-for="(tab, k) in getTabs(tabs, 'doc')"
          :key="k"
          v-show="k == active"
          :doc="tab.data"
          :type="tab.data.type"
          :suppress="k != active"
        />
        <Chat
          v-if="tabs[active] && tabs[active].tabType === 'chat'"
          :chat="tabs[active].data"
        />
      </el-main>
  </el-container>
</template>

<script>
import Editor from "@/components/Editor";
import Chat from "@/components/Chat";
import API from '../biz/API';

export default {
  props: ["tabs", "active"],
  components: { Editor, Chat },
  data() {
    return {
      r: true,
      user: null
    }
  },
  created() {
    this.user = API.user;
  },
  methods: {
    _refresh() {
      this.r = false;
      this.$nextTick(() => {
        this.r = true;
      })
    },
    switchTab(k, tabType, id) {
      this.$emit("tabSwitch", k, tabType, id);
    },
    closeTab(k, tabType, id) {
      this.$emit("tabClosed", k, tabType, id);
    },
    getTabs(tabs, type) {
      let result = {};
      for (let key in tabs) {
        if (tabs[key].tabType === type) {
          result[key] = tabs[key];
        }
      }
      return result;
    },
    theOther(sender, receiver) {
      let other = this.user.id === sender.id ? receiver : sender;
      return other.nickname;
    }
  },
  watch: {
    "active": function (v) {
      this._refresh();
    }
  }
}
</script>

<style scoped>
.root {
  width: 100%;
  user-select: none;
}

.tab-container {
  display: flex;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  position: relative;
  width: auto;
  min-width: 0;
  padding: 0 0.5rem;
  border: 1px solid rgba(102, 102, 102, .1);
  border-bottom: none;
  border-top: none;
  cursor: pointer;
}

.active {
  background: white;
}

.info {
  font-family: 'Consolas';
  font-size: 16px;
  color: #666;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.ops i {
  color:#666;
}

.ops i:hover {
  color: #ccc;
  cursor: pointer;
}

.ops {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}
</style>