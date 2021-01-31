function getRecycledFromTree(root, eachCallback = (node) => {}) {
    if (root.recycled) {
        eachCallback(root);
        return;
    }
    for (let key in root.children) {
        getRecycledFromTree(root.children[key], eachCallback);
    }
}

export default getRecycledFromTree;