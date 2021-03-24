import Quill from "quill";
const crypto = require("crypto");
const Inline = Quill.import("blots/inline");

export default class UserBlock extends Inline {
    static create(value) {
        let domNode = super.create();
        if (typeof value === "object") {
            UserBlock.user = value;
            domNode.setAttribute('title', `本段作者: ${UserBlock.user.nickname}<${UserBlock.user.email}>`);
            domNode.setAttribute('style', `
                display: inline;
                border-left: 2px solid ${UserBlock.getColorByUserId(UserBlock.user.id)};
                padding: 3px 0px;
                padding-left: 3px;`);
            return domNode;
        } else {
            return domNode;
        }
    }
}

UserBlock.blotName = "user";
UserBlock.tagName = ["T"];
UserBlock.getColorByUserId = function(userId) {
    var md5 = crypto.createHash("md5");
    for (let i = 0; i < UserBlock.user.id % 1024; ++i) {
        userId = md5.update("" + userId);
    }
    userId = userId.digest("hex");
    return "#" + userId.slice(-6);
}