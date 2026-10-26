/**
 * 代码编辑器的内核：CodeMirror 6。CodeEditor.tsx 挂载时建一个；不用 Vue 时也可以直接调 createEditor。
 * 语言由使用方传（CodeMirror 的语言扩展，如 json()、java()），默认 TSX。
 *
 * 颜色、字体全部取主题 token（colors.code* 与 Shiki 代码块同一套），切换主题、主题编辑器调色都跟着变；
 * 明暗只影响 CodeMirror 自带的少量默认样式，用 Compartment 切换。
 * Tab 用来缩进；按 Esc 后再按 Tab 才把焦点移出编辑器（CodeMirror 的 tab-focus 模式），键盘用户不会被困住。
 */
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  temporarilySetTabFocusMode,
} from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { Annotation, Compartment, EditorState, type Extension } from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { colors, fonts, fontSizes, radii } from '../config/theme/tokens';

// token 在运行时是 var(--哈希) 字符串
const c = (token: unknown) => String(token);

/** 标记 setCode 发起的修改：不当作用户编辑回传 */
const external = Annotation.define<boolean>();

const highlightStyle = HighlightStyle.define([
  {
    tag: [tags.keyword, tags.modifier, tags.operatorKeyword, tags.self],
    color: c(colors.codeKeyword),
  },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: c(colors.codeString) },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: c(colors.codeNumber) },
  {
    tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
    color: c(colors.codeFunction),
  },
  { tag: [tags.typeName, tags.className, tags.namespace], color: c(colors.codeType) },
  { tag: tags.comment, color: c(colors.codeComment), fontStyle: 'italic' },
  { tag: [tags.punctuation, tags.angleBracket], color: c(colors.codeComment) },
  { tag: tags.tagName, color: c(colors.codeTag) },
  { tag: tags.attributeName, color: c(colors.codeAttribute) },
  { tag: tags.invalid, color: c(colors.dangerText) },
]);

const theme = EditorView.theme({
  '&': {
    height: '100%',
    color: c(colors.text),
    backgroundColor: c(colors.surface),
    fontSize: c(fontSizes.sm),
  },
  // 外框（CodeEditor）画焦点环
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: c(fonts.mono),
    lineHeight: '1.6',
    // CodeMirror 自己管滚动，套不了 ScrollArea：原生滚动条改细，滑块取浮层滚动条（scrollAreaBarStyles.thumb）的颜色，外观一致
    scrollbarWidth: 'thin',
    scrollbarColor: `color-mix(in srgb, ${c(colors.textMuted)} 50%, transparent) transparent`,
  },
  '.cm-content': { caretColor: c(colors.text), paddingBlock: '12px' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: c(colors.text) },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    { backgroundColor: c(colors.selection) },
  '.cm-activeLine': { backgroundColor: c(colors.surfaceMuted) },
  // 行号与 CodeBlock 的同色：textPlaceholder 在编辑器底色上不到 4.5:1
  '.cm-gutters': {
    color: c(colors.codeComment),
    backgroundColor: c(colors.surface),
    border: 'none',
  },
  '.cm-activeLineGutter': { color: c(colors.text), backgroundColor: c(colors.surfaceMuted) },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: c(colors.accentSoft),
    outline: `1px solid ${c(colors.accentBorder)}`,
  },
  '.cm-selectionMatch, .cm-searchMatch': { backgroundColor: c(colors.highlight) },
  '.cm-tooltip': {
    color: c(colors.text),
    backgroundColor: c(colors.surfaceRaised),
    border: `1px solid ${c(colors.border)}`,
    borderRadius: c(radii.md),
    overflow: 'hidden',
  },
  '.cm-tooltip-autocomplete > ul': { fontFamily: c(fonts.mono) },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    color: c(colors.text),
    backgroundColor: c(colors.accentSoft),
  },
  '.cm-panels': { color: c(colors.text), backgroundColor: c(colors.surfaceMuted) },
  '.cm-panels-bottom': { borderTop: `1px solid ${c(colors.border)}` },
});

/** 编辑器实例的操作 */
export interface CodeEditorHandle {
  /** CodeMirror 的视图：读状态（view.state）、派发修改、做撤销等更细的操作 */
  readonly view: EditorView;
  /** 换掉全部代码（与当前内容相同时什么都不做） */
  setCode(code: string): void;
  /** 跟随站点主题的明暗 */
  setDark(dark: boolean): void;
  /** 拆掉编辑器（组件卸载时） */
  destroy(): void;
}

/** createEditor 的选项 */
export interface CodeEditorOptions {
  /** 初始代码 */
  code: string;
  /** 当前是不是暗色主题 */
  dark: boolean;
  /** 编辑区的无障碍名称 */
  label: string;
  /** 语言扩展；不给时是 TSX */
  language?: Extension;
  /** 只读：能选中、复制、搜索，不能改 */
  readonly?: boolean;
  /** 用户改了代码 */
  onChange: (code: string) => void;
}

/** 在 parent 里创建编辑器 */
export function createEditor(
  parent: HTMLElement,
  { code, dark, label, language, readonly, onChange }: CodeEditorOptions,
): CodeEditorHandle {
  const darkMode = new Compartment();
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        foldGutter(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        language ?? javascript({ jsx: true, typescript: true }),
        EditorState.readOnly.of(readonly === true),
        syntaxHighlighting(highlightStyle),
        EditorState.tabSize.of(2),
        theme,
        darkMode.of(EditorView.darkTheme.of(dark)),
        EditorView.contentAttributes.of({ 'aria-label': label }),
        keymap.of([
          ...closeBracketsKeymap,
          ...completionKeymap,
          ...searchKeymap,
          ...foldKeymap,
          ...historyKeymap,
          ...defaultKeymap,
          // 补全、搜索面板没有接住的 Esc：下一次 Tab 移出焦点
          { key: 'Escape', run: temporarilySetTabFocusMode },
          indentWithTab,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && update.transactions.some((tr) => !tr.annotation(external)))
            onChange(update.state.doc.toString());
        }),
      ],
    }),
  });
  return {
    view,
    setCode(next) {
      if (next === view.state.doc.toString()) return;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: next },
        annotations: external.of(true),
      });
    },
    setDark(next) {
      view.dispatch({ effects: darkMode.reconfigure(EditorView.darkTheme.of(next)) });
    },
    destroy: () => view.destroy(),
  };
}
