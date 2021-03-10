function countKeyVal(tree, key, val) {
    let result = tree[key] === val ? 1 : 0;
    if (tree.children) {
        for (let childKey in tree.children) {
            let child = tree.children[childKey];
            result += countKeyVal(child, key, val);
        }
    }
    return result;
}

export { countKeyVal }