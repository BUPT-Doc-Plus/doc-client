const sharedb = require("sharedb/lib/client");
const richText = require("rich-text");
const otText = require("ot-text");
const API = require("../biz/API").default;
const config = require("../biz/config").default;
sharedb.types.register(richText.type);
sharedb.types.register(otText.type);
var ReconnectingWebSocket = require("reconnecting-websocket").default;
if (ReconnectingWebSocket === undefined) {
  ReconnectingWebSocket = require("reconnecting-websocket");
}

class DocClient {
  constructor() {
    this.type = "rich-text";
    this.doc = null;
    this.logged = false;
  }

  connect(docId, userId, connectedCallback = (data) => {}) {
    if (this.connection) {
      this.close();
    }
    this.loginSocket = new ReconnectingWebSocket(DocClient.loginURL(userId));
    this.loginSocket.send(JSON.stringify({
      token: API.token(),
      docId: docId
    }));
    this.loginSocket.onmessage = (e) => {
      this.socket = new ReconnectingWebSocket(DocClient.url(docId, userId, this.type));
      this.connection = new sharedb.Connection(this.socket);
      this.doc = this.connection.get("document", "" + docId);
      connectedCallback(e.data);
    }
  }

  _close(sess) {
    if (sess !== undefined)
      sess.close();
    sess = undefined;
  }

  close() {
    this._close(this.connection);
    this._close(this.loginSocket);
    this._close(this.socket);
  }
}

DocClient.url = (docId, userId, type) => `ws://${config.midHost}/${type}/${docId}/${userId}?token=${API.token()}`;
DocClient.loginURL = (userId) => `ws://${config.midHost}/login/${userId}?token=${API.token()}`;

module.exports = {DocClient};