const { DocFileSystem } = require("./src/file/DocFileSystem");
const NodeWebSocket = require("ws");
const { Path } = require("./src/file/Path");
const assert = require("assert");

const RECONNECT_OPS = {
    connectionTimeout: 400,
    WebSocket: NodeWebSocket,
    debug: false,
    maxReconnectionDelay: 10000,
    maxRetries: Infinity,
    minReconnectionDelay: 4000,
    reconnectionDelayGrwoFactor: 1.3
}

var dfs = new DocFileSystem(RECONNECT_OPS);
dfs.connect(1, () => {});

module.exports = { dfs };