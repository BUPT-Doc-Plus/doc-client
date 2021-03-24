<template>
  <div
    class="full"
    v-loading="loadingEditor"
    element-loading-background="rgba(255, 255, 255, 1)">
    <div class="float-btn" title="查看历史记录" @click="history.showDrawer = true">
      <i class="el-icon-time"/>
    </div>
    <el-drawer
      :title='`"${doc.label}"的历史记录`'
      :visible.sync="history.showDrawer"
      :with-header="true">
      <el-timeline>
        <el-timeline-item
          v-for="(op, idx) in history.records"
          :key="idx"
          :color="idx < (history.records.length - history.stepBack) ? '#44CC00' : '#E4E7ED'"
          :class="idx < (history.records.length - history.stepBack - 1) ? 'timeline-enabled' : 'timeline-disabled'"
          :timestamp="new Date(op.attributes.time * 60000).toLocaleString().slice(0, -3)">
          <el-button
            class="ckpt"
            :title="op.attributes.user.email"
            type="text"
            @click="loadCkpt(idx)">作者: {{ op.attributes.user.nickname }}</el-button>
        </el-timeline-item>
      </el-timeline>
    </el-drawer>
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
      history: {
        stepBack: 0,
        showDrawer: false,
        records: []
      }
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
          this.history.records = this.dc.doc.data.ops.slice(0, -1);
          this.monacoEditor.setValue(quill.getText());
          quill.on("editor-change", (eventName, ...args) => {
            this.history.records = this.dc.doc.data.ops.slice(0, -1);
            if (eventName === "selection-change") {
              if (args[0] === null) return;
              console.log(quill.enabled);
            }
            if (quill.getFormat().user === undefined) {
              quill.format("user", API.user);
            }
          })
          quill.on("text-change", (delta, oldDelta, source) => {
            if (source !== quill && source !== "user") return;
            if (source === "user") {
              let cur = 0;
              delta.ops.forEach(op => {
                let d = op.insert && op.insert.length || -op.delete || op.retain;
                if (op.insert || op.delete) {
                  if (op.insert) {
                    quill.formatText(cur, d, "user", API.user);
                  }
                  if (op.attributes === undefined) {
                    op.attributes = {
                      user: API.user,
                      time: parseInt(Date.now()/60000)
                    };
                  } else if (op.attributes.userId === undefined && op.attributes.time === undefined) {
                    op.attributes = {
                      ...op.attributes,
                      user: API.user,
                      time: parseInt(Date.now()/60000)
                    };
                  }
                }
                cur += d;
              });
            }
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
    loadCkpt(idx) {
      this.history.stepBack = this.history.records.length - idx - 1;
      var quill = this.$refs["editor-" + this.doc.id].quill;
      if (this.history.stepBack === 0) {
        quill.enable();
      } else {
        quill.disable();
      }
      let ops = this.history.records.slice(0, idx + 1);
      quill.setContents({ ops });
    }
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
.float-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  position: absolute;
  right: 20px;
  bottom: 20px;
  font-size: 30px;
  width: 40px;
  height: 40px;
  background: none;
  transition: all 200ms;
}
.float-btn:hover {
  background: rgba(0, 0, 0, .1);
}
.timeline-enabled .el-timeline-item__tail {
  border-left: 2px solid #44CC00;
}
.timeline-disabled .el-timeline-item__tail {
  border-left: 2px solid #E4E7ED;
}
.ckpt {
  padding: 0;
  margin: 0;
}
</style>