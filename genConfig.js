const fs = require("fs")
const ini = require("ini")

var info = ini.parse(fs.readFileSync("../config.ini", "utf-8"))

var config = {
    bizHost: `${info["doc-server"]["host"]}:${info["doc-server"]["port"]}`,
    midHost: `${info["doc-collaborate"]["host"]}:${info["doc-collaborate"]["port"]}`,
    nlpHost: `${info["doc-nlp"]["host"]}:${info["doc-nlp"]["port"]}`,
    suffix: {
        "py": "python",
        "c": "cpp",
        "cpp": "cpp",
        "h": "cpp",
        "hpp": "cpp",
        "class": "java",
        "cs": "c#",
        "js": "javascript",
        "ts": "typescript",
        "md": "markdown"
    }
};

fs.writeFileSync("src/biz/config.js", `export default ${JSON.stringify(config, null, 4)}`);
