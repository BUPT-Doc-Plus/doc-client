<template>
  <div
    class="full"
    v-loading="loadingEditor"
    element-loading-background="rgba(255, 255, 255, 1)"> 
    <div
      id="editor-box"
      class="full"
      style="width: 100%; overflow: hidden"
    >
      <quill-editor
        :id="'editor-' + doc.id"
        v-show="type === 'rich'"
        v-model="content"
        :ref="'editor-' + doc.id"
        :options="editorOption"
      ></quill-editor>
      <div v-show="type !== 'rich'" class="full" style="display: flex">
        <div
          :id="'monaco-box-' + doc.id"
          class="full"
          style="display: flex; flex: 1; transform: translate(5px)"
          :span="12"
        >
          <MonacoEditor
            class="pointEventNone"
            :language="monacoLanguage"
            :code="code"
            :ref="'monaco-' + doc.id"
            @mounted="onMonacoMounted"
            theme="vs"
            style="display: flex; flex: 1"
          />
        </div>
        <div
          v-show="type === 'markdown' || monacoLanguage === 'markdown'"
          class="full"
          :span="12"
          style="display: flex; flex: 1"
        >
          <div :id="'parsedMd-' + doc.id" style="padding: 0 5%"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import config from "../biz/config";
import { quillEditor } from "vue-quill-editor";
import MonacoEditor from "vue-monaco-editor";
import MarkdownIt from "markdown-it";
import { DocClient } from "../client/DocClient";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";
import API from "../biz/API";
const Diff = require("diff");
import { diff2Ops, cursorOffset } from "../util/diff2ops";

export default {
  props: ["doc", "type", "suppress"],
  components: {
    quillEditor,
    MonacoEditor,
  },
  destroyed() {
    this.dc.close();
  },
  created() {
    this.dc = new DocClient();
    this.loadingEditor = true;
    if (this.type === "code") {
      let names = this.doc.label.split(".");
      let suffix = names[names.length - 1];
      if (config.suffix[suffix]) {
        suffix = config.suffix[suffix];
      }
      this.monacoLanguage = suffix;
    }
    this.init();
  },
  mounted() {
    for (let e of document.getElementsByClassName("ql-snow")) {
      e.style.border = "none";
    }
  },
  data() {
    return {
      dc: undefined,
      md: new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
      }),
      code: "",
      content: "",
      editorOption: {},
      monacoEditor: null,
      loadingEditor: false,
      monacoLanguage: "markdown",
    };
  },
  methods: {
    init() {
      this.dc.connect(this.doc.id, API.user.id, (access) => {
        if (access === "r") {
          this.monacoEditor.updateOptions({ readOnly: true });
          if (this.$refs["editor-" + this.doc.id].quill.disable)
            this.$refs["editor-" + this.doc.id].quill.disable();
          else this.$refs["editor-" + this.doc.id].quill.editor.enable(false);
          if (this.dc.logged) {
            this.$message({
              type: "warning",
              message: "您的权限已被更改为只读",
            });
          }
        } else if (access === "w") {
          this.monacoEditor.updateOptions({ readOnly: false });
          if (this.$refs["editor-" + this.doc.id].quill.enable)
            this.$refs["editor-" + this.doc.id].quill.enable();
          else this.$refs["editor-" + this.doc.id].quill.editor.enable(true);
          if (this.dc.logged) {
            this.$message({
              type: "success",
              message: "您的权限已被更改为可协作",
            });
          }
        }
        this.dc.doc.subscribe((err) => {
          if (err) throw err;
          var quill = this.$refs["editor-" + this.doc.id].quill;
          quill.setContents(this.dc.doc.data);
          this.monacoEditor.setValue(quill.getText());
          quill.format("user", API.user.id);
          quill.on("text-change", (delta, oldDelta, source) => {
            if (source !== quill && source !== "user") return;
            this.dc.doc.submitOp(delta, { source: quill });
          });
          this.dc.doc.on("op", (op, source) => {
            if (source === quill) return;
            quill.updateContents(op);
            this.$refs["monaco-" + this.doc.id].$off("codeChange");
            let { lineNumber, column } = this.monacoEditor.getPosition();
            column += cursorOffset(this.monacoEditor.getValue(), op.ops, {
              lineNumber,
              column,
            });
            this.monacoEditor.setValue(quill.getText());
            this.monacoEditor.setPosition({ lineNumber, column });
            this.$refs["monaco-" + this.doc.id].$on("codeChange", () => {
              this.updateRenderedMd();
              this.$refs["monaco-" + this.doc.id].$on(
                "codeChange",
                codeChangeHanlder
              );
            });
          });
          var codeChangeHanlder = () => {
            let diff = Diff.diffChars(
              quill.getText(),
              this.monacoEditor.getValue()
            );
            let ops = diff2Ops(diff);
            quill.updateContents(ops, quill);
            this.updateRenderedMd();
          };
          this.$refs["monaco-" + this.doc.id].$on(
            "codeChange",
            codeChangeHanlder
          );
          this.loadingEditor = false;
        });
      });
    },
    onMonacoMounted(editor) {
      this.monacoEditor = editor;
      document.getElementById(
        "parsedMd-" + this.doc.id
      ).innerHTML = this.md.render(this.monacoEditor.getValue());
    },
    updateRenderedMd() {
      document.getElementById(
        "parsedMd-" + this.doc.id
      ).innerHTML = this.md.render(this.monacoEditor.getValue());
    },
    trimEndLinebreak(s) {
      if (s.endsWith("\n")) return s.slice(0, -1);
      return s;
    },
  },
};
</script>

<style>
#monaco-box div {
  resize: vertical;
}
#editor-box.ql-container.ql-snow {
    height: auto;
}
#editor-box .ql-editor {
    height: 600px;
    overflow-y: scroll;
}
</style>