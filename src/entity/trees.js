var trees = [
  {
    id: 1,
    label: "软件工程导论",
    show: false,
    children: [
      {
        id: 2,
        label: "需求文档",
        type: 'rich-text'
      },
      {
        id: 3,
        label: "设计文档",
        type: 'rich-text'
      },
      {
        id: 4,
        label: "评审文档",
        type: 'rich-text'
      },
    ],
  },
  {
    id: 5,
    label: "期末总结",
    type: 'markdown',
    show: false,
  },
  {
    id: 6,
    label: "OOAD",
    show: false,
    children: [
      {
        id: 7,
        label: "OO分析",
        type: 'rich-text',
      },
      {
        id: 8,
        label: "OO设计",
        show: false,
        children: [
          {
            id: 9,
            label: "类图",
            type: 'rich-text',
          },
          {
            id: 10,
            label: "顺序图",
            type: 'rich-text',
          },
          {
            id: 11,
            label: "进程图",
            type: 'rich-text',
          },
        ],
      },
    ],
  },
  {
    id: 12,
    label: "算法与数据结构",
    show: false,
    children: [
      {
        id: 13,
        label: "二叉树",
        type: 'rich-text',
      },
      {
        id: 14,
        label: "图论",
        show: false,
        children: [
          {
            id: 15,
            label: "有向无环图",
            type: 'rich-text',
          },
        ],
      },
    ],
  },
  {
    id: 16,
    label: "Java程序设计",
    show: false,
    children: [
      {
        id: 17,
        label: "基本语法",
        show: false,
        children: [
          {
            id: 18,
            label: "Java虚拟机概述",
            type: 'rich-text',
          },
          {
            id: 19,
            label: "数据类型",
            show: false,
            children: [
              {
                id: 20,
                label: "整型",
                type: 'rich-text',
              },
            ],
          },
        ],
      },
      {
        id: 21,
        label: "面向对象",
        type: 'rich-text',
        show: false,
      },
    ],
  },
];

export { trees };