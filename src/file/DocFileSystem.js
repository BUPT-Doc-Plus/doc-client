const sharedb = require("sharedb/lib/client");
const API = require("../biz/API").default;
const config = require("../biz/config").default;

var ReconnectingWebSocket = require("reconnecting-websocket").default;
if (ReconnectingWebSocket === undefined) {
  ReconnectingWebSocket = require("reconnecting-websocket");
}
const {Path} = require("./Path");
const {abs} = require("../util/digest");

class DocFileSystem {
  constructor(RECONNECT_OPS = null) {
    this.doc = null;
    this.clipboard = {
      folder: "",
      file: "",
      cut: false
    }
    this.RECONNECT_OPS = RECONNECT_OPS;
    this.allowFields = [
      "children", "collaborators", "creator", "label",
      "path", "id", "recycled", "type", "doc_accessible", "show"];
  }

  connect(userId, connectedCallback = () => {
  }, operationCallback = (op, source) => {
  }, disconnectCallback = () => {}) {
    if (this.RECONNECT_OPS === null)
      this.socket = new ReconnectingWebSocket(DocFileSystem.url.document(userId));
    else this.socket = new ReconnectingWebSocket(
      DocFileSystem.url.document(userId),
      undefined,
      this.RECONNECT_OPS
    );
    this.socket.onclose = disconnectCallback;
    this.connection = new sharedb.Connection(this.socket);
    this.doc = this.connection.get("tree-document", "" + userId);
    this.doc.subscribe((err) => {
      if (err) throw err;
      this.doc.on("op", (op, source) => {
        operationCallback(op, source);
      })
      connectedCallback(this.doc);
    })
  }

  close() {
    if (this.connection !== undefined)
      this.connection.close();
    this.connection = undefined;
    if (this.socket !== undefined)
      this.socket.close();
    this.socket = undefined;
  }

  _trimRedundant(item) {
    for (let key in item) {
      if (this.allowFields.indexOf(key) === -1) {
        delete item[key];
      }
    }
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

  touch(path, data, cb=()=>{}) {
    if (!path.endsWith("/")) path += "/";
    let p = new Path(path + abs(data.label + "-" + data.id));
    if (this.get(p.path) !== undefined)
      return false;
    let parent = this.get(path);
    if (parent === undefined || parent.children === undefined)
      return false;
    data.path = p.path;
    this._trimRedundant(data);
    this.doc.submitOp([
      {
        p: ["root", ...p.jpath],
        oi: data
      },
      {
        p: ["idPath", data.id],
        oi: data
      }
    ], null, () => {
      cb(p.path);
    });
    return true;
  }

  mkdir(path, cb=()=>{}) {
    if (path.endsWith("/")) path = path.slice(0, -1);
    if (this.get(path) !== undefined) return false;
    let p = new Path(path);
    let label = p.target;
    p.target = abs(p.target + "-" + Date.now());
    if (this.get(p.parent.path) === undefined) {
      this.mkdir(p.parent.path);
    }
    if (p.target !== "") {
      let data = {
        label: label,
        path: p.path,
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
      ], null, () => {
        cb(p.path);
      });
    }
    return true;
  }

  recycle(path, cb=()=>{}) {
    if (this.get(path) === undefined)
      return false;
    let isDir = path.endsWith("/");
    if (isDir) path = path.slice(0, -1);
    let p = new Path(path);
    let ops = [
      {
        p: ["root", ...p.jpath, "recycled"],
        oi: true
      },
      {
        p: ["root", ...p.jpath, "selected"],
        oi: false
      }
    ];
    this.doc.submitOp(ops, null, () => {
      cb(p.path);
    });
    return true;
  }

  restore(path, cb=()=>{}) {
    if (this.get(path) === undefined)
      return false;
    let isDir = path.endsWith("/");
    if (isDir) path = path.slice(0, -1);
    let p = new Path(path);
    let ops = [
      {
        p: ["root", ...p.jpath, "recycled"],
        oi: false
      },
      {
        p: ["root", ...p.jpath, "selected"],
        oi: false
      }
    ];
    this.doc.submitOp(ops, null, () => {
      cb(p.path);
    });
    return true;
  }

  remove(path, cb=()=>{}) {
    let item = this.get(path);
    if (item === undefined)
      return false;
    let isDir = path.endsWith("/");
    if (isDir) path = path.slice(0, -1);
    let p = new Path(path);
    let ops = [
      {
        p: ["root", ...p.jpath],
        od: item
      }
    ];
    if (item.id) {
      ops.push({
        p: ["idPath", item.id],
        od: isDir ? (p.path + "/") : p.path
      })
    }
    this.doc.submitOp(ops, null, () => {
      cb(p.path);
    });
    return true;
  }

  move(src, dest, cb=()=>{}) {
    if (this.get(src) === undefined)
      return false;
    let [folder, file] = DocFileSystem.splitLast(src);
    if (!dest.endsWith("/")) dest += "/";
    if (this.get(dest) === undefined || this.get(dest).children === undefined)
      return -1;
    let flag = 0;
    src = folder + file;
    let destFile = dest + file;
    if (this.get(destFile) !== undefined) {
      flag = 1;
    }
    if (src === destFile) {
      return 0;
    }
    let dp = new Path(destFile);
    let ops = [
      {
        p: ["root", ...dp.jpath],
        oi: this.get(src)
      },
      {
        p: ["root", ...dp.jpath, "path"],
        oi: destFile
      }
    ];
    if (this.get(src).id) {
      ops.push({
        p: ["idPath", this.get(src).id],
        oi: destFile
      })
    }
    this.doc.submitOp(ops, null, () => {
      this.remove(src, () => {
        cb(dp.path);
      });
    });
    return flag;
  }

  rename(path, newName, cb=()=>{}) {
    let p = new Path(path);
    let newPath = p.parent.path + abs(newName) + (p._isDir ? "/" : "");
    if (this.get(newPath) !== undefined)
      return false;
    this.get(p.path).label = newName;
    this.get(p.path).path = newPath;
    this._trimRedundant(this.get(p.path));
    let np = new Path(newPath);
    let destJPath = ["root", ...np.jpath];
    let srcJPath = ["root", ...p.jpath];
    if (destJPath[destJPath.length - 1] === "children") {
      destJPath = destJPath.slice(0, -1)
    }
    if (srcJPath[srcJPath.length - 1] === "children") {
      srcJPath = srcJPath.slice(0, -1)
    }
    let ops = [
      {
        p: destJPath,
        oi: this.get(p.path)
      },
      {
        p: srcJPath,
        od: this.get(p.path)
      }
    ];
    if (this.get(p.path).id) {
      ops.push({
        p: ["idPath", this.get(p.path).id],
        oi: np.path
      })
    }
    this.doc.submitOp(ops, null, () => {
      cb(p.path);
    });
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

var dfs = new DocFileSystem();

module.exports = {DocFileSystem, dfs};
