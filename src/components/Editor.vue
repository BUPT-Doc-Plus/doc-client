<template>
  <div class="full" style="width: 100%; overflow: hidden">
    <quill-editor
      v-show="type === 'rich-text'"
      v-model="content"
      ref="editor"
      :options="editorOption"
    ></quill-editor>
    <div v-show="type !== 'rich-text'" class="full" style="display: flex;">
      <div
        id="monaco-box"
        class="full"
        style="border-right: 0.7px solid #bbb; display: flex; flex: 1;"
        :span="12"
      >
        <MonacoEditor
          :language="type"
          :code="code"
          @mounted="onMonacoMounted"
          @codeChange="onCodeChange"
          theme="vs"
          style="display: flex; flex: 1"
        />
      </div>
      <div class="full" :span="12" style="display: flex; flex: 1">
        <div id="parsedMd" style="padding: 0 5%"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { quillEditor } from "vue-quill-editor";
import MonacoEditor from "vue-monaco-editor";
import MarkdownIt from "markdown-it";
import { RichTextDoc } from "../doc/RichTextDoc";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";
import API from '../biz/API';

var rtd = new RichTextDoc();

export default {
  props: ["doc", "type"],
  components: {
    quillEditor,
    MonacoEditor,
  },
  destroyed() {
    rtd.close();
  },
  mounted() {
    this.init();
  },
  data() {
    return {
      md: new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
      }),
      code: "",
      content: "",
      editorOption: {},
      monacoEditor: null,
    };
  },
  methods: {
    init() {
      rtd.connect(this.doc.id, API.currentUser(), () => {
        rtd.doc.subscribe((err) => {
          if (err) throw err;
          var quill = this.$refs["editor"].quill;
          quill.setContents(rtd.doc.data);
          quill.on("text-change", (delta, oldDelta, source) => {
            if (source !== "user") return;
            rtd.doc.submitOp(delta, { source: quill });
          });
          rtd.doc.on("op", (op, source) => {
            if (source === quill) return;
            quill.updateContents(op);
          });
        });
      });
      for (let e of document.getElementsByClassName("ql-snow")) {
        e.style.border = "none";
      }
    },
    onMonacoMounted(editor) {
      this.monacoEditor = editor;
      this.onCodeChange(editor);
    },
    onCodeChange(editor) {
      document.getElementById("parsedMd").innerHTML = this.md.render(
        this.monacoEditor.getValue()
      );
    },
  }
};
</script>

<style scoped>
#monaco-box div {
  resize: vertical;
}
</style>