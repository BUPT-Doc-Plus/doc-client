<template>
  <div style="flex: 1; display: flex;" >
    <div v-if="loading" class="lb welcome back">
      <span id="t-5">■</span>
      <span id="t-6">■</span>
      <span id="t-7">■</span>
      <span id="t-8">■</span>
      <span id="t-9">■</span>
      <span id="t-10">■</span>
      <span id="t-11">■</span>
      <span id="t-12">■</span>
    </div>
    <div id="chat-box" class="full" style="width: 100%;">
      <div
        id="record-box" v-if="rr" class="record-box" :style="`height: ${getRecordBoxHeight()}px; overflow: auto`">
        <div
          :class="'forward forward-' + (record.sender.id === sender.id ? 1 : 0)"
          v-for="(record, key) in p.records"
          :key="key"
        >
          <!-- <i v-show="!record.forward" class="el-icon-user" /> -->
          <el-card :class="'card-' + ((record.sender.id === sender.id) ? 'send' : 'recv')">
            <span class="ql-editor" style="white-space: pre-wrap; padding-left: 0; padding-right: 0;" v-html="record.msg"></span>
          </el-card>
          <!-- <i v-show="record.forward" class="el-icon-user" /> -->
        </div>
      </div>
      <div
        id="chat-input"
        style="height: auto; padding-top: 10px;"
      >
        <div>
          <quill-editor
            ref="rich-chat-editor"
            v-model="text"
            @keydown.exact.shift.native="shift = true"
            @keyup.exact.shift.native="shift = false"
            @keydown.exact.enter.native="handleEnter()"
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
  </div>
</template>

<script>
import { quillEditor } from "vue-quill-editor";
import API from '../biz/API';
import AuthorAPI from '../biz/AuthorAPI';
import ChatAPI from '../biz/ChatAPI';
import { ChatClient } from '../client/ChatClient';

export default {
  props: ["chat"],
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
      shift: false,
      reverse: false,
      sender: null,
      receiver: null,
      p: {
        records: [],
        initPage: 0,
        page: 0,
        pageSize: 10,
      },
      loading: true,
    };
  },
  created() {
    window.onresize = (e) => {
      this._refreshRecordBox(true);
    }
    window.onkeyup = (e) => {
      if (e.keyCode === 13) {
        this.quill.enable();
        this.quill.focus();
      }
    }
    this.rr = false;
    this.sender = API.user;
    this.$nextTick(() => {
      this.rr = true;
    })
    this.receiver = this.chat.initiator.id === this.sender.id ? this.chat.recipient : this.chat.initiator;
    ChatClient.addHandler((data) => {
      this._refreshRecordBox();
    })
    ChatAPI.getRecords(this.chat.id, this.p.page, this.p.pageSize).then((resp) => {
      this.p.records = resp.data.data;
      this.$nextTick(() => {
        document.getElementById("record-box").scroll(0, 1e+9);
      })
      this.loading = false;
      document.getElementById("record-box").onscroll = (e) => {
        if (document.getElementById("record-box").scrollTop === 0 && this.p.records.length < this.chat.records.length) {
          this.loading = true;
          let prevScrollHeight = document.getElementById("record-box").scrollHeight;
          ChatAPI.getRecords(this.chat.id, this.p.page + 1, this.p.pageSize).then((resp) => {
            this.p.page += 1;
            let records = this.p.records;
            records.unshift(...resp.data.data);
            this.p.records = records;
            this.loading = false;
            this.$nextTick(() => {
              document.getElementById("record-box").scroll(0, document.getElementById("record-box").scrollHeight - prevScrollHeight - 100)
            })
          })
        }
      };
    })
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
            document.getElementById("record-box").onscroll = (e) => {
              if (document.getElementById("record-box").scrollTop === 0 && this.p.records.length < this.chat.records.length) {
                this.loading = true;
                let prevScrollHeight = document.getElementById("record-box").scrollHeight;
                ChatAPI.getRecords(this.chat.id, this.p.page + 1, this.p.pageSize).then((resp) => {
                  this.p.page += 1;
                  let records = this.p.records;
                  records.unshift(...resp.data.data);
                  this.p.records = records;
                  this.loading = false;
                  this.$nextTick(() => {
                    document.getElementById("record-box").scroll(0, document.getElementById("record-box").scrollHeight - prevScrollHeight - 100)
                  })
                })
              }
            };
          })
        })
      }
    },
    handleEnter() {
      if (!this.shift && this.mode === "plain") {
        this.sendMessage(true);
        this.quill.disable();
      }
    },
    sendMessage(byEnter=false) {
      let message = this.quill.container.firstChild.innerHTML;
      if (byEnter && message.endsWith("<p><br></p>")) {
        message = message.slice(0, -11);
      }
      if (message.length === 0 || message === "<p><br></p>") {
        this.$message({
          type: "error",
          message: "不能发送空消息",
        });
        this.text = "";
      } else {
        let parsedMessage = this.parseMessage(message);
        ChatClient.send(parsedMessage);
        this.p.records.push(parsedMessage);
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
        let chatInputHeight = document.getElementById("chat-input").clientHeight;
        let result = document.body.clientHeight - chatInputHeight - 80;
        return result;
      } catch (err) {
        this._refreshRecordBox(true);
        return 1;
      }
    },
    parseMessage(msg) {
      return {
        chat_id: this.chat.id,
        sender: this.sender,
        receiver: this.receiver,
        msg: msg,
        time: Date.now()
      }
    }
  },
};
</script>

<style scoped>
.ql-editor {
  height: auto;
  max-height: 250px;
  overflow: auto;
}
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
.welcome {
  position: absolute;
  z-index: -1;
  user-select: none;
  display: flex;
}
.title {
  font-size: 100px;
}
.lb {
  font-size: 15px;
  justify-content: center;
  color: rgb(168, 131, 255);
}
.back {
  transform: translate(-100px, -10px);
}
#t-5 {
  animation: fly 3.2s infinite 1.4s;
}
#t-6 {
  animation: fly 3.2s infinite 1.2s;
}
#t-7 {
  animation: fly 3.2s infinite 1.0s;
}
#t-8 {
  animation: fly 3.2s infinite 0.8s;
}
#t-9 {
  animation: fly 3.2s infinite 0.6s;
}
#t-10 {
  animation: fly 3.2s infinite 0.4s;
}
#t-11 {
  animation: fly 3.2s infinite 0.2s;
}
#t-12 {
  animation: fly 3.2s infinite 0.0s;
}
@keyframes fly {
  0% { transform: translate(0px, 0px); }
  100% { transform: translate(2000px, 0px); }
}
</style>