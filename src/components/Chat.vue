<template>
  <div id="chat-box" class="full" style="width: 100%">
    <div id="record-box" v-if="rr" class="record-box" :style="`height: ${getRecordBoxHeight()}px; overflow: auto`">
      <div
        :class="'forward forward-' + record.forward"
        v-for="(record, key) in message.records"
        :key="key"
      >
        <!-- <i v-show="!record.forward" class="el-icon-user" /> -->
        <el-card :class="'card-' + (record.forward ? 'send' : 'recv')">
          <span style="white-space: pre-wrap">{{ record.msg }}</span>
        </el-card>
        <!-- <i v-show="record.forward" class="el-icon-user" /> -->
      </div>
    </div>
    <div
      id="chat-input"
      :style="`position: absolute; bottom: 10px; left: ${getAsideWidth() + 50}px; right: 0px;`"
    >
      <div>
        <quill-editor
          ref="rich-chat-editor"
          v-model="text"
          @keydown.exact.shift.native="shift = true"
          @keyup.exact.shift.native="shift = false"
          @keyup.exact.enter.native="handleEnter()"
          :options="{ placeholder: '' }"
        ></quill-editor>
        <div class="tool-bar">
          <div class="bar-l">
            <span
              ><i
                @click="switchMode()"
                :style="`color: ${mode === 'plain' ? '#666' : '#66c'};`"
                >A</i
              ></span
            >
            <span><i>☺</i></span>
            <span><i class="el-icon-share" /></span>
          </div>
          <div class="bar-r">
            <span
              ><i class="el-icon-s-promotion" @click="sendMessage()"
            /></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { quillEditor } from "vue-quill-editor";

export default {
  props: ["message"],
  inject: ["getAsideWidth"],
  components: {
    quillEditor,
  },
  data() {
    return {
      rr: true,
      text: "",
      quill: null,
      toolbar: null,
      mode: "plain",
      msgText: "",
      shift: false
    };
  },
  mounted() {
    var quill = this.$refs["rich-chat-editor"].quill;
    this.quill = quill;
    this.toolbar = this.quill.getModule("toolbar");
    this.hideToolbar();
  },
  methods: {
    _refreshRecordBox(init=false, scroll="retain") {
      if (init) {
        this.rr = false;
        this.$nextTick(() => {
          this.rr = true;
        })
      } else {
        let rb = document.getElementById("record-box");
        if (scroll === "retain") {
          scroll = rb.scrollTop;
        } else if (scroll === "bottom") {
          scroll = 1e+9;
        } else {
          scroll = 0;
        }
        this.rr = false;
        this.$nextTick(() => {
          this.rr = true;
          this.$nextTick(() => {
            rb = document.getElementById("record-box");
            rb.scroll(0, scroll);
          })
        })
      }
    },
    handleEnter() {
      if (!this.shift &&this.mode === "plain") {
        this.sendMessage();
      }
    },
    sendMessage() {
      let message = this.quill.getText();
      if (message.endsWith("\n")) {
        message = message.slice(0, -1);
      }
      if (message.trim() === "") {
        this.$message({
          type: "error",
          message: "不能发送空消息",
        });
        this.text = "";
      } else {
        this.message.records.push({ forward: 1, msg: message });
        this.text = "";
      }
      this._refreshRecordBox(false, "bottom");
    },
    switchMode() {
      if (this.mode === "plain") {
        this.mode = "rich";
        this.text = this.text;
        this.showToolbar();
      } else {
        this.mode = "plain";
        this.text = this.$refs["rich-chat-editor"].quill.getText();
        this.hideToolbar();
      }
    },
    showToolbar() {
      this.toolbar.container.style = "";
      this.quill.on("text-change", () => {});
    },
    hideToolbar() {
      this.toolbar.container.style =
        "height: 0; padding: 0; overflow: hidden; border-top: none;";
    },
    getRecordBoxHeight() {
      try {
        let chatBoxHeight = document.getElementById("chat-box").clientHeight;
        let chatInputHeight = document.getElementById("chat-input").clientHeight;
        let result = chatBoxHeight - chatInputHeight - 50;
        return result;
      } catch (err) {
        this._refreshRecordBox(true);
        return 1;
      }
    }
  },
};
</script>

<style scoped>
.forward {
  display: flex;
  align-items: center;
  margin: 20px 0;
}
.forward-0 {
  justify-content: flex-start;
}
.forward-1 {
  justify-content: flex-end;
}
#chat-box .el-icon-user {
  display: flex;
  font-size: 50px;
  align-items: center;
}
#chat-box > div {
  padding: 0 10%;
}
.card-send {
  background: rgb(231, 231, 244);
}
.tool-bar {
  display: flex;
  color: #666;
  font-size: 22px;
}
.bar-l {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.bar-r {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.bar-l span {
  display: inline-block;
  margin-right: 20px;
}
.bar-r span {
  display: inline-block;
  margin-left: 20px;
}
.tool-bar i {
  font-style: normal;
}
.tool-bar i:hover {
  cursor: pointer;
  color: #aaa;
}
.icon-md {
  font-size: 15px;
  font-family: "Consolas";
}
.record-box {
  border-bottom: 1px solid rgba(102, 102, 102, .1);
}
</style>