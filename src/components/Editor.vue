<template>
  <div class="full" style="overflow: hidden">
    <quill-editor
      v-show="type === 'rich-text'"
      v-model="content"
      :ref="`editor-${doc.id}`"
      :options="editorOption"
    ></quill-editor>
    <el-row v-show="type === 'markdown'" class="full">
      <el-col id="monaco-box" class="full" style="border-right: 0.7px solid #bbb;" :span="12">
        <MonacoEditor
          language="markdown"
          :code="code"
          @mounted="onMonacoMounted"
          @codeChange="onCodeChange"
          theme="vs"
        />
      </el-col>
      <el-col class="full" :span="12">
        <div id="parsedMd" style="padding: 0 5%;"></div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { quillEditor } from "vue-quill-editor";
import MonacoEditor from "vue-monaco-editor";
import MarkdownIt from "markdown-it";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";
export default {
  props: ["doc", "type"],
  components: {
    quillEditor,
    MonacoEditor,
  },
  mounted() {
    this.content = localStorage.getItem(`doc-${this.doc.id}`) || "";
    this.code = localStorage.getItem(`doc-${this.doc.id}`) || "";
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
    handleInput() {
      localStorage.setItem(`doc-${this.doc.id}`, this.content);
    },
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
  watch: {
    doc: function (newDoc) {
      this.content = localStorage.getItem(`doc-${newDoc.id}`) || "";
    },
  },
};
</script>

<style scoped>
#monaco-box div {
  resize: vertical;
}
</style>