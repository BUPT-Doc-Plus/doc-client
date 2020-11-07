<template>
  <div id="chat-box" class="full">
    <div style="height: 90%; overflow: auto">
      <div
        :class="'forward forward-' + record.forward"
        v-for="(record, key) in message.records"
        :key="key"
      >
        <i v-show="!record.forward" class="el-icon-user" />
        <el-card>
          {{ record.msg }}
        </el-card>
        <i v-show="record.forward" class="el-icon-user" />
      </div>
    </div>
    <div style="height: 10%">
      <div id="chat-input">
        <el-input v-model="text" @keyup.enter.native="sendMessage"></el-input>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["message"],
  data() {
    return {
      text: "",
    };
  },
  methods: {
    sendMessage() {
      this.message.records.push({ forward: 1, msg: this.text });
      this.text = "";
    },
  },
};
</script>

<style>
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
</style>