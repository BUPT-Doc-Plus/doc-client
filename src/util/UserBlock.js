import Quill from "quill";

const Block = Quill.import("blots/block");

const colors = {};

export default class UserBlock extends Block {
    formatAt(index, length, name, value) {
        if (name === "user") {
            this.domNode.setAttribute("user", value);
        }
        super.formatAt(index, length, name, value);
    }
    insertAt(index, value, def) {
        super.insertAt(index, value, def);
    }
}
