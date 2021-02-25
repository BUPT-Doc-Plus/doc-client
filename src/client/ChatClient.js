const config = require("../biz/config").default;
import API from "../biz/API";

var ReconnectingWebSocket = require("reconnecting-websocket").default;
if (ReconnectingWebSocket === undefined) {
  ReconnectingWebSocket = require("reconnecting-websocket");
}

class ChatClient {
  static connect(userId) {
    if (ChatClient.sess) return;
    ChatClient.sess = new ReconnectingWebSocket(ChatClient.chatURL(userId));
    ChatClient.sess.onmessage = (e) => {
      for (let handler of ChatClient.handlers)
        handler(JSON.parse(e.data));
    };
  }

  static addHandler(handler) {
    ChatClient.handlers.push(handler);
  }

  static removeHandler(handler) {
    let idx = ChatClient.handlers.indexOf(handler);
    ChatClient.handlers.splice(idx, 1);
  }

  static send(data) {
    ChatClient.sess.send(JSON.stringify(data));
  }

  static close() {
    ChatClient.sess.close();
    ChatClient.sess = null;
  }
}

ChatClient.sess = null;
ChatClient.chatURL = (userId) => `ws://${config.midHost}/chat/${userId}?token=${API.token()}`;
ChatClient.handlers = [];

module.exports = { ChatClient };