/**
 * 代码编辑器组件：外壳与输入框相同（边框、悬停、焦点环），里面是 CodeMirror（editor.ts）。
 * CodeMirror 只在这个子路径里：页面用到编辑器时才随子路径加载，组件库主入口不带它。
 *
 *   <CodeEditor _value={code} aria-label="代码" sx={styles.editor} />
 *   <CodeEditor _value={manifest} language={json()} aria-label="字段清单" onReady={(editor) => …} />
 *
 * 高度由使用方给（sx），默认 20rem；未声明的属性落到外壳上。颜色、字体取主题 token，跟着主题变。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { Extension } from '@codemirror/state';
import { useConfig } from '../config/context';
import { inputRecipe } from '../input/control';
import { mergeAttrs, type PartProps } from '../utils/props';
import { onBeforeUnmount, onMounted, watch } from 'vue';
import { createEditor, type CodeEditorHandle } from './editor';

const styles = css.create({
  // 输入框外壳是一行的 inline-flex：改成整块，内边距交给 CodeMirror
  root: {
    display: 'block',
    height: '20rem',
    paddingInline: 0,
    overflow: 'hidden',
  },
});

/** CodeEditor 的属性 */
export interface CodeEditorProps extends PartProps<'div'> {
  /** 代码：父级写 _value={x} 双向绑定 */
  _value?: string;
  /** 编辑区的无障碍名称 */
  'aria-label': string;
  /** 语言扩展（CodeMirror 的 json()、java()……）；不给时是 TSX。只在挂载时读 */
  language?: Extension;
  /** 只读：能选中、复制、搜索，不能改 */
  readonly?: boolean;
  /** 编辑器建好了：拿到 CodeMirror 的视图，做撤销、读选区这类更细的操作 */
  onReady?: (editor: CodeEditorHandle) => void;
}

/** 代码编辑器：语法高亮、括号匹配、缩进、搜索，颜色跟随主题 */
export const CodeEditor = _component(
  ({
    _value: value = _bindable(''),
    'aria-label': label,
    language,
    readonly,
    onReady,
    ...rest
  }: CodeEditorProps) => {
    const config = useConfig();
    let host = _state.raw<HTMLElement | null>(null);
    let editor: CodeEditorHandle | undefined;
    const isDark = () => config.theme.colorScheme === 'dark';

    onMounted(() => {
      editor = createEditor(host!, {
        code: value,
        dark: isDark(),
        label,
        language,
        readonly,
        onChange: (code) => (value = code),
      });
      onReady?.(editor);
    });
    onBeforeUnmount(() => editor?.destroy());
    watch(
      () => value,
      (code) => editor?.setCode(code),
    );
    watch(isDark, (dark) => editor?.setDark(dark));

    return () => (
      <div
        {...mergeAttrs<'div'>({ sx: [inputRecipe().root, styles.root] }, rest, {
          ref: _toRef(host),
        })}
      />
    );
  },
);
