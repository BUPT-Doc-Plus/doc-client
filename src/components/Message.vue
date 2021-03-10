<template>
  <div>
    <div
      v-for="(chat, key) in chats"
      :key="key"
      :class="chat === selected ? 'msg-box-selected' : 'msg-box'"
      @click="select(chat)"
    >
      <div class="sender" v-if="r">
        <b class="username">{{ theOther(chat.initiator, chat.recipient) }}</b>
        <span class="datetime"
          >{{
            new Date(chat.preview.time)
              .toTimeString()
              .split(" ")[0]
          }}
        </span>
      </div>
      <div
        class="preview"
        v-html="
          chat.preview.msg.replace(/\<.*?\>/g, '')
        "
        style="width: 85%; display: inline-block"
      ></div>
      <div id="circle" v-show="chat.unread">
        {{ chat.unread > 99 ? "99+" : chat.unread }}
      </div>
    </div>
  </div>
</template>

<script>
import AuthorAPI from "../biz/AuthorAPI";
import API from "../biz/API";
import { ChatClient } from "../client/ChatClient";
import ChatAPI from "../biz/ChatAPI";

export default {
  inject: ["getAsideWidth"],
  data() {
    return {
      r: true,
      chatIdx: {},
      chats: [],
      selected: null,
      notifyTask: null,
      hidden: false,
      totalUnread: 0,
    };
  },
  created() {
    document.addEventListener("visibilitychange", () => {
      this.hidden = document.hidden;
    });
    ChatClient.connect(API.user.id);
    ChatClient.addHandler((data) => {
      let { chat_id } = data;
      if (this.chatIdx[chat_id]) {
        if (data.sender.id !== API.user.id) {
          this.notify(data.sender.nickname, data.msg.replace(/\<.*?\>/g, ""));
          this.$emit("message", data);
          if (this.chatIdx[chat_id].unread === undefined) {
            this.chatIdx[chat_id].unread = 0;
          }
          this.chatIdx[chat_id].unread++;
          this.totalUnread++;
          this.chatIdx[chat_id].records.push(data);
        }
      } else {
        ChatAPI.getChatById(chat_id).then((resp) => {
          this.chatIdx[chat_id] = resp.data.data;
          this.chats.push(this.chatIdx[chat_id]);
        });
      }
    });
    ChatAPI.getAllChats(API.user.id).then((resp) => {
      this.chats = resp.data.data;
      for (let chat of this.chats) {
        this.chatIdx[chat.id] = chat;
      }
    });
  },
  methods: {
    _refresh() {
      this.r = false;
      this.$nextTick(() => {
        this.r = true;
      });
    },
    select(chat) {
      this.totalUnread -= chat.unread;
      this.$emit("selectChat", chat, chat.unread);
      chat.unread = 0;
      this.selected = chat;
      this._refresh();
    },
    theOther(sender, receiver) {
      let other = API.user.id === sender.id ? receiver : sender;
      return other.nickname;
    },
    notify(title, msg) {
      if (!this.hidden) return;
      Notification.requestPermission(() => {
        var notification = new Notification(title, {
          body: msg,
          icon: "",
          dir: "auto",
        });
        setTimeout(notification.close, 5000);
      });
    },
    isMinStatus() {
      var isMin = false;
      if (window.outerWidth != undefined) {
        isMin = window.outerWidth <= 160 && window.outerHeight <= 27;
      } else {
        isMin = window.screenTop < -30000 && window.screenLeft < -30000;
      }
      return isMin;
    },
  },
};
</script>

<style scoped>
.msg-box:hover {
  background: rgba(200, 200, 200, 0.2);
  cursor: pointer;
}
.msg-box {
  user-select: none;
  height: 60px;
  font-family: "Consolas";
  color: #555;
  padding: 8px;
}
.msg-box-selected {
  user-select: none;
  height: 60px;
  font-family: "Consolas";
  color: #555;
  padding: 8px;
  background: rgba(0, 0, 255, 0.05);
}
.preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-top: 10px;
  font-size: 15px;
}
.sender {
  display: flex;
}
.username {
  font-size: 16px;
  display: flex;
  flex: 1;
  justify-content: flex-start;
}
.datetime {
  display: flex;
  flex: 1;
  justify-content: flex-end;
  color: #666;
  font-size: 14px;
  padding-right: 5px;
}
#circle {
  display: inline-block;
  padding: 3px;
  min-width: 18px;
  height: 18px;
  background: red;
  border-radius: 18px;
  color: white;
  text-align: center;
}
</style>