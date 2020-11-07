<template>
  <div>
    <div
      v-for="(msg, key) in messages"
      :key="key"
      :class="msg === selected ? 'msg-box-selected' : 'msg-box'"
      @click="select(msg)"
    >
      <div class="sender">
        <b class="username">{{ msg.sender }}</b>
        <span class="datetime">{{ msg.time }}</span>
      </div>
      <div class="preview">{{ msg.preview }}</div>
    </div>
  </div>
</template>

<script>
import { messages } from "@/entity/message";

export default {
  data() {
    return {
      messages: messages,
      selected: null,
    };
  },
  methods: {
    select(msg) {
      this.selected = msg;
      this.$emit("selectChat", msg);
    }
  }
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
}
</style>