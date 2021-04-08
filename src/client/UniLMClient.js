const config = require("../biz/config").default;


var ReconnectingWebSocket = require("reconnecting-websocket").default;
if (ReconnectingWebSocket === undefined) {
  ReconnectingWebSocket = require("reconnecting-websocket");
}

class UniLMClient {
  static connect() {
    if (UniLMClient.sess) return;
    UniLMClient.sess = new ReconnectingWebSocket(UniLMClient.url);
    UniLMClient.sess.onmessage = (e) => {
      for (let handler of UniLMClient.handlers)
        handler(JSON.parse(e.data));
    };
  }

  static addHandler(handler) {
    UniLMClient.handlers.push(handler);
  }

  static removeHandler(handler) {
    let idx = UniLMClient.handlers.indexOf(handler);
    UniLMClient.handlers.splice(idx, 1);
  }

  static send(data) {
    UniLMClient.sess.send(JSON.stringify(data));
  }

  static close() {
    UniLMClient.sess.close();
    UniLMClient.sess = null;
  }
}

UniLMClient.sess = null;
UniLMClient.url = `ws://${config.nlpHost}/summary`;
UniLMClient.handlers = [];

module.exports = { UniLMClient };