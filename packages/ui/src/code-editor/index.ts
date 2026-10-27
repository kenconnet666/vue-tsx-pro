/**
 * 代码编辑器（子路径 `@zerodep-dev/vue-tsx-pro-ui/code-editor`）：CodeMirror 6，颜色、字体取主题 token；Esc 后 Tab 移出焦点。
 * 依赖可选的 peer：@codemirror/*（autocomplete、commands、lang-javascript、language、search、state、view）与 @lezer/highlight，用到时安装。
 *
 *   import { CodeEditor } from '@zerodep-dev/vue-tsx-pro-ui/code-editor';
 *   <CodeEditor _value={source} aria-label="表单源码" />
 */
export { CodeEditor, type CodeEditorProps } from './CodeEditor';
export { createEditor, type CodeChange, type CodeEditorHandle, type CodeEditorOptions } from './editor';
