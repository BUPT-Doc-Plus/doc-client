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
  constructor(type, RECONNECT_OPS = null) {
    this.type = type;
    this.doc = null;
    this.RECONNECT_OPS = RECONNECT_OPS;
  }

  connect(docId, userId, connectedCallback = () => {
  }) {
    let socket;
    if (this.RECONNECT_OPS === null)
      socket = new ReconnectingWebSocket(DocClient.url(docId, userId, this.type));
    else socket = new ReconnectingWebSocket(
      DocClient.url(docId, userId, this.type),
      undefined,
      this.RECONNECT_OPS
    );
    this.connection = new sharedb.Connection(socket);
    this.doc = this.connection.get("document", "" + docId);
    connectedCallback();
  }

  close() {
    if (this.connection !== undefined)
      this.connection.close();
    this.connection = undefined;
  }
}

DocClient.url = (docId, userId, type) => `ws://${config.midHost}/${type}/${docId}/${userId}?token=${API.token()}`;

module.exports = {DocClient};
