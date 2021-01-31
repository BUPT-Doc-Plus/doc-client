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

  static getDocClient(docId, userId) {
    let client;
    if (DocClient.instances[docId + "-" + userId] === undefined) {
      client = new DocClient();
      DocClient.instances[docId + "-" + userId] = client;
      return client;
    }
    client = DocClient.instances[docId + "-" + userId];
    client.logged = false;
    return client;
  }

  connect(docId, userId, connectedCallback = (data) => { }) {
    if (DocClient.loginSockets[docId + "-" + userId] === undefined) {
      this.loginSocket = new ReconnectingWebSocket(DocClient.loginURL(userId));
      this.loginSocket.send(JSON.stringify({
        token: API.token(),
        docId: docId
      }));
    } else {
      this.loginSocket = DocClient.loginSockets[docId + "-" + userId];
    }
    this.loginSocket.onmessage = (e) => {
      if (!this.logged) {
        if (DocClient.docs[docId + "-" + userId] === undefined) {
          let socket = new ReconnectingWebSocket(DocClient.url(docId, userId, this.type));
          this.connection = new sharedb.Connection(socket);
          this.doc = this.connection.get("document", "" + docId);
          connectedCallback(e.data);
        } else {
          this.doc = DocClient.docs[docId + "-" + userId];
          this.doc.fetch((err) => {
            connectedCallback(e.data);
          })
        }
        this.logged = true;
        return;
      }
      connectedCallback(e.data);
    }
  }
}

DocClient.url = (docId, userId, type) => `ws://${config.midHost}/${type}/${docId}/${userId}?token=${API.token()}`;
DocClient.loginURL = (userId) => `ws://${config.midHost}/login/${userId}?token=${API.token()}`;
DocClient.instances = {};
DocClient.loginSockets = {};
DocClient.docs = {};

module.exports = { DocClient };
