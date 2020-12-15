<template>
  <div class="full" style="overflow: hidden">
    <quill-editor
      v-show="type === 'rich-text'"
      v-model="content"
      ref="editor"
      :options="editorOption"
    ></quill-editor>
    <el-row v-show="type !== 'rich-text'" class="full">
      <el-col
        id="monaco-box"
        class="full"
        style="border-right: 0.7px solid #bbb"
        :span="12"
      >
        <MonacoEditor
          :language="type"
          :code="code"
          @mounted="onMonacoMounted"
          @codeChange="onCodeChange"
          theme="vs"
        />
      </el-col>
      <el-col class="full" :span="12">
        <div id="parsedMd" style="padding: 0 5%"></div>
      </el-col>
    </el-row>
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
    rtd.connect(this.doc.id, 1, () => {
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
    onMonacoMounted(editor) {
      this.monacoEditor = editor;
      this.onCodeChange(editor);
    },
    onCodeChange(editor) {
      localStorage.setItem(`doc-${this.doc.id}`, this.monacoEditor.getValue());
      document.getElementById("parsedMd").innerHTML = this.md.render(
        this.monacoEditor.getValue()
      );
    },
  },
};
</script>

<style scoped>
#monaco-box div {
  resize: vertical;
}
</style>