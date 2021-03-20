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

  static getShare(doc, cache=true) {
    let cachePromise = new Promise((resolve) => {
      resolve(Tree.cache[doc.id]);
    });
    let loadPromise = DocAPI.getDoc(doc.id).then((resp) => {
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
      let result = new Tree({
        children: {
          result: {
            label: "搜索结果",
            show: true,
            nonContext: true,
            children: []
          },
          collaborate: {
            label: `协作者`,
            show: true,
            nonContext: true,
            children: collaborate
          },
          read: {
            label: `阅读者`,
            show: true,
            nonContext: true,
            children: read
          }
        }
      });
      Tree.cache[doc.id] = result;
      return result;
    })
    if (cache && Tree.cache[doc.id] !== undefined) {
      return cachePromise;
    } else {
      return loadPromise;
    }
  }
}
Tree.cache = {};
