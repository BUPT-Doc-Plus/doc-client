function diff2Ops(diff) {
    let ops = [];
    for (let i = 0; i < diff.length; ++i) {
        if (diff[i].added === undefined && diff[i].removed === undefined) {
            ops.push({ retain: diff[i].count });
        } else if (diff[i].added !== undefined) {
            ops.push({ insert: diff[i].value });
        } else {
            ops.push({ delete: diff[i].value.length });
        }
    }
    return ops;
}

function _getLineNumbersAndColumns(lineLengths, sortedPositions) {
    let linesAndColumns = [];
    let total = 0;
    let p = 0;
    for (let i = 0; i < lineLengths.length; ++i) {
        total += lineLengths[i] + 1;
        while (total > sortedPositions[p]) {
            linesAndColumns.push([i + 1, lineLengths[i] - (total - sortedPositions[p++]) + 2]);
        }
    }
    return linesAndColumns;
}

function cursorOffset(oldCode, ops, currentPosition) {
    let offset = 0;
    let { lineNumber, column } = currentPosition;
    let lineLengths = oldCode.split("\n").map(line => line.length);
    let position = 0;
    let posDeltaMap = {};
    for (let i = 0; i < ops.length; ++i) {
        if (ops[i].retain) {
            position += ops[i].retain;
        } else if (ops[i].insert) {
            posDeltaMap[position] = ops[i].insert.length;
        } else if (ops[i].delete) {
            posDeltaMap[position] = -ops[i].delete;
            position += ops[i].delete;
        }
    }
    let keys = Object.keys(posDeltaMap).map(k => parseInt(k));
    let linesAndColumns = _getLineNumbersAndColumns(lineLengths, keys);
    for (let i = 0; i < keys.length; ++i) {
        let [line, col] = linesAndColumns[i];
        if (line === lineNumber && col < column) {
            offset += posDeltaMap[keys[i]];
        }
    }
    return offset;
}

// var oldCode = `# Hello

// - Hello
// - 你好
// - Bonjour
// - Hallo
// - Hola
// - 11
// - Hola!
// `
// var ops = [{ retain: 2 }, { insert: "1" }];
// var currentPosition = { lineNumber: 1, column: 8 }
// var offset = cursorOffset(oldCode, ops, currentPosition)

module.exports = { diff2Ops, cursorOffset };