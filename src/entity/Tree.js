import ReconnectingWebSocket from 'reconnecting-websocket';
import sharedb from 'sharedb/lib/client';

export default class Tree {
    constructor(object) {
        Object.assign(this, object);
        if (object.children) {
            for (let i = 0; i < object.children.length; i++) {
                object.children.push(new Tree(object.children.shift()));
            }
        }
    }
    static connectDocument(userId) {
        if (Tree.session.document[userId] === undefined) {
            let socket = new ReconnectingWebSocket(Tree.url.document + userId);
            let connection = new sharedb.Connection(socket);
            Tree.session.document[userId] = connection;
        }
        return Tree.session.document[userId];
    }
    static getDocument(userId) {
        return new Tree({
            children: [
                {
                    id: 1,
                    label: "算法",
                    creator: 1,
                    collaborators: null,
                    show: false,
                    children: [
                        { id: 2, label: "动态规划", type: "rich-text", creator: 1, collaborators: [2, 3] },
                        { id: 3, label: "二叉树", type: "rich-text", creator: 1, collaborators: [2, 3] },
                    ]
                },
                {
                    id: 4,
                    label: "计算机网络",
                    creator: 1,
                    collaborators: null,
                    show: false,
                    children: [
                        { id: 5, label: "TCP协议", type: "rich-text", creator: 1, collaborators: [2, 3] },
                        { id: 6, label: "HTTP协议", type: "rich-text", creator: 1, collaborators: [2, 3] },
                    ]
                },
            ]
        });
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
    static getShare(userId, docId) {
        return new Tree({
            children: [
                {
                    label: "搜索结果",
                    show: true,
                    nonContext: true,
                    children: [
                        {
                            id: 1,
                            label: "苏喆",
                            joined: false
                        },
                        {
                            id: 2,
                            label: "沈兆聪",
                            joined: false
                        },
                        {
                            id: 3,
                            label: "蔡宇昂",
                            joined: false
                        }
                    ]
                },
                {
                    label: "",
                    show: true,
                    nonContext: true,
                    children: [
                        {
                            id: 4,
                            label: "sb1",
                            joined: true
                        },
                        {
                            id: 5,
                            label: "sb2",
                            joined: true
                        },
                        {
                            id: 6,
                            label: "sb3",
                            joined: true
                        }
                    ]
                }
            ]
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
    document: "ws://localhost:8088/tree/document/"
}
Tree.session = {
    document: {}
};