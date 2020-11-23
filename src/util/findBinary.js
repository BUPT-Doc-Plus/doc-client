var compare = (a, b) => {
    if (a.label === "$recycledBin") return -1;
    if (b.label === "$recycledBin") return 1;
    if (a.children === undefined && b.children !== undefined) {
        return 1;
    } else if (a.children !== undefined && b.children === undefined) {
        return -1;
    } else {
        if (a.label < b.label) {
            return -1;
        } else {
            return 1;
        }
    }
};

function findBinary(folder, item, begin, end) {
    let mid = Math.floor((begin + end) / 2);
    if (begin === end) return mid;
    if (compare(item, folder[mid]) === -1) {
        return findBinary(folder, item, begin, mid);
    } else {
        return findBinary(folder, item, mid + 1, end);
    }
}

export default findBinary;