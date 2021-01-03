import DocAPI from "../biz/DocAPI";

export default class Tree {
  constructor(object) {
    Object.assign(this, object);
    if (object.children) {
      for (let i = 0; i < object.children.length; i++) {
        let child = new Tree(object.children.shift());
        child.parent = object;
        object.children.push(child);
      }
    }
  }

  static connectTree(userId) {
    return {
      children: {
        "算法": {
          id: 1,
          label: "算法",
          creator: 1,
          collaborators: null,
          show: false,
          children: {
            "动态规划": {id: 2, label: "动态规划", type: "rich-text", creator: 1, collaborators: [2, 3]},
            "二叉树": {id: 3, label: "二叉树", type: "rich-text", creator: 1, collaborators: [2, 3]},
          }
        },
        "计算机网络": {
          id: 4,
          label: "计算机网络",
          creator: 1,
          collaborators: null,
          show: false,
          children: {
            "七层协议": {
              id: 7, label: "七层协议", creator: 1, collaborators: null, show: false, children: {
                "TCP协议": {id: 5, label: "TCP协议", type: "rich-text", creator: 1, collaborators: [2, 3]},
                "HTTP协议": {id: 6, label: "HTTP协议", type: "rich-text", creator: 1, collaborators: [2, 3]},
              }
            }
          }
        }
      }
    };
  }

  static getRecycled(userId) {
    return new Tree({
      children: [
        {
          label: "回收站",
          show: true,
          children: [
            {
              label: "Hello, world",
              type: "markdown"
            },
            {
              label: "你好世界",
              type: "markdown"
            }
          ]
        }
      ]
    });
  }

  static getShare(doc, searchResultCache) {
    return DocAPI.getDoc(doc.id).then((resp) => {
      doc = resp.data.data;
      let collaborate = [], read = [];
      let accessible = doc.doc_accessible;
      for (let acc of accessible) {
        acc.label = `${acc.author.nickname}<${acc.author.email}>`;
        for (let prop in acc.author) {
          acc[prop] = acc.author[prop];
        }
        if (acc.role === 0) {
          read.push(acc);
        } else {
          collaborate.push(acc);
        }
      }
      return new Tree({
        children: {
          result: {
            label: "搜索结果",
            show: true,
            nonContext: true,
            children: searchResultCache ? searchResultCache : []
          },
          collaborate: {
            label: "",
            show: true,
            nonContext: true,
            children: collaborate
          },
          read: {
            label: "",
            show: true,
            nonContext: true,
            children: read
          }
        }
      })
    })
  }

  static getSearch() {
    return new Tree({
      children: [
        {
          label: "搜索结果",
          show: true,
          nonContext: true,
          children: [
            {
              id: 2,
              label: "需求文档",
              type: "rich-text"
            },
            {
              id: 3,
              label: "设计文档",
              type: "rich-text"
            },
            {
              id: 4,
              label: "评审文档",
              type: "rich-text"
            }
          ]
        }
      ]
    })
  }
}
Tree.url = {
  document: "ws://localhost:8088/tree/document/",
}
Tree.session = {};
