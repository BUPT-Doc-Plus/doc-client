const sharedb = require("sharedb/lib/client");
const API = require("../biz/API").default;
const config = require("../biz/config").default;

var ReconnectingWebSocket = require("reconnecting-websocket").default;
if (ReconnectingWebSocket === undefined) {
  ReconnectingWebSocket = require("reconnecting-websocket");
}
const {Path} = require("./Path");

class DocFileSystem {
  constructor(RECONNECT_OPS = null) {
    this.doc = null;
    this.clipboard = {
      folder: "",
      file: "",
      cut: false
    }
    this.RECONNECT_OPS = RECONNECT_OPS;
  }

  connect(userId, connectedCallback = () => {
  }, operationCallback = () => {
  }, disconnectCallback = () => {}) {
    let socket;
    if (this.RECONNECT_OPS === null)
      socket = new ReconnectingWebSocket(DocFileSystem.url.document(userId));
    else socket = new ReconnectingWebSocket(
      DocFileSystem.url.document(userId),
      undefined,
      this.RECONNECT_OPS
    );
    socket.onclose = disconnectCallback;
    this.connection = new sharedb.Connection(socket);
    this.doc = this.connection.get("tree-document", "" + userId);
    this.doc.subscribe((err) => {
      if (err) throw err;
      this.doc.on("op", (op) => {
        operationCallback(op, this.doc);
      })
      connectedCallback(this.doc);
    })
  }

  close() {
    if (this.connection !== undefined)
      this.connection.close();
    this.connection = undefined;
  }

  get(path) {
    if (path === "/") return this.doc.data.root;
    if (path.endsWith("/")) path = path.slice(0, -1);
    let jpath = new Path(path).jpath;
    let root = this.doc.data.root;
    for (let p of jpath) {
      root = root[p];
      if (root === undefined)
        return root;
    }
    return root;
  }

  touch(path, data) {
    if (!path.endsWith("/")) path += "/";
    let p = new Path(path + data.label + "-" + data.id);
    if (this.get(p.path) !== undefined)
      return false;
    let parent = this.get(path);
    if (parent === undefined || parent.children === undefined)
      return false;
    data.path = p.path;
    this.doc.submitOp([
      {
        p: ["root", ...p.jpath],
        oi: data
      }
    ]);
    return true;
  }

  mkdir(path) {
    if (path.endsWith("/")) path = path.slice(0, -1);
    if (this.get(path) !== undefined) return false;
    let p = new Path(path);
    if (this.get(p.parent.path) === undefined) {
      this.mkdir(p.parent.path);
    }
    if (p.target !== "") {
      let data = {
        label: p.target,
        path: path,
        creator: 1,
        children: {},
        collaborators: null,
        show: false
      };
      this.doc.submitOp([
        {
          p: ["root", ...p.jpath],
          oi: data
        }
      ]);
    }
    return true;
  }

  remove(path) {
    if (path.endsWith("/")) path = path.slice(0, -1);
    if (this.get(path) === undefined)
      return false;
    let p = new Path(path);
    this.doc.submitOp({
      p: ["root", ...p.jpath],
      od: this.get(path)
    });
    return true;
  }

  copy(src) {
    if (this.get(src) === undefined)
      return false;
    [this.clipboard.folder, this.clipboard.file] = DocFileSystem.splitLast(src);
    return true;
  }

  cut(src) {
    if (this.get(src) === undefined)
      return false;
    [this.clipboard.folder, this.clipboard.file] = DocFileSystem.splitLast(src);
    this.clipboard.cut = true;
    return true;
  }

  paste(dest) {
    if (!dest.endsWith("/")) dest += "/";
    if (this.get(dest) === undefined || this.get(dest).children === undefined)
      return -1;
    let flag = 0;
    let src = this.clipboard.folder + this.clipboard.file;
    let destFile = dest + this.clipboard.file;
    if (this.get(destFile) !== undefined) {
      flag = 1;
    }
    this.doc.submitOp([
      {
        p: ["root", ...new Path(destFile).jpath],
        oi: this.get(src)
      },
      {
        p: ["root", ...new Path(destFile).jpath, "path"],
        oi: destFile
      }
    ]);
    if (this.clipboard.cut) {
      this.clipboard.cut = false;
      this.remove(src);
    }
    return flag;
  }

  rename(path, newName) {
    let p = new Path(path);
    let newPath = p.parent.path + newName + (p._isDir ? "/" : "");
    if (this.get(newPath) !== undefined)
      return false;
    this.get(path).label = newName;
    this.get(path).path = newPath;
    this.doc.submitOp([
      {
        p: ["root", ...new Path(newPath).jpath],
        oi: this.get(path)
      },
      {
        p: ["root", ...p.jpath],
        od: this.get(path)
      }
    ])
    return true;
  }
}

DocFileSystem.url = {
  document: (userId) => `ws://${config.midHost}/tree/document/${userId}?token=${API.token()}`
};
DocFileSystem.splitLast = function (path) {
  path = path.split("").reduce((a, b) => (a.slice(-1) === "/" && b === "/") ? a : (a + b));
  let pathList = path.split("/");
  let newDir = "";
  if (pathList.slice(-1)[0] === "") {
    newDir = pathList.slice(-2)[0];
    pathList = pathList.slice(0, -2);
  } else {
    newDir = pathList.slice(-1)[0];
    pathList = pathList.slice(0, -1);
  }
  return [pathList.join("/") + "/", newDir];
}
DocFileSystem.recycleTemplate = {
  id: -1,
  label: "$recycleBin",
  show: false,
  children: {}
};

module.exports = {DocFileSystem};
