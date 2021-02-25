const crypto = require("crypto");

function abs(s) {
    var md5 = crypto.createHash("md5");
    return md5.update(s).digest("hex");
}

module.exports = { abs }