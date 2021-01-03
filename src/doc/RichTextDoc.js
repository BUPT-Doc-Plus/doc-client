const sharedb = require("sharedb/lib/client");
const richText = require("rich-text");
sharedb.types.register(richText.type);
var ReconnectingWebSocket = require("reconnecting-websocket").default;
if (ReconnectingWebSocket === undefined) {
  ReconnectingWebSocket = require("reconnecting-websocket");
}

class RichTextDoc {
  constructor(RECONNECT_OPS = null) {
    this.doc = null;
    this.RECONNECT_OPS = RECONNECT_OPS;
  }

  connect(docId, userId, connectedCallback = () => {
  }) {
    let socket;
    if (this.RECONNECT_OPS === null)
      socket = new ReconnectingWebSocket(RichTextDoc.url.collaborate(docId, userId));
    else socket = new ReconnectingWebSocket(
      RichTextDoc.url.collaborate(docId, userId),
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

RichTextDoc.url = {
  collaborate: (docId, userId) => `ws://localhost:8088/collaborate/${docId}/${userId}?token=V20xV2JGcHRXWGhaZW1zd1RUSldiVTlIVFRST2FrazBUWHBDYVUxNlVUUk5WRlpzVFdwTmVVMXFWVDA9`
}

module.exports = {RichTextDoc};
