const crypto = require("crypto");

function abs(s) {
    var md5 = crypto.createHash("md5");
    s = md5.update(s).digest("hex");
    for (let i = 0; i < 3; ++i) {
        s = btoa(s);
    }
    return s;
}

module.exports = { abs }