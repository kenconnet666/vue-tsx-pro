/**
 * 代码演练场的编辑器组件：外壳与输入框相同（边框、悬停、焦点环），里面是 CodeMirror（editor.ts，挂载后才加载）。
 *
 *   <CodeEditor value={_bind(code)} aria-label="代码" sx={styles.editor} />
 *
 * 高度由使用方给（sx），默认 20rem；未声明的属性落到外壳上。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { controlShellStyles, mergeAttrs, useConfig, type PartProps } from '@vue-tsx-pro/ui';
import { onBeforeUnmount, onMounted, watch } from 'vue';
import type { PlaygroundEditor } from './editor';

const styles = stylex.create({
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
  /** 代码：父级写 value={_bind(x)} 双向绑定 */
  value?: string;
  /** 编辑区的无障碍名称 */
  'aria-label': string;
}

/** TSX 代码编辑器：语法高亮、括号匹配、缩进、搜索，颜色跟随站点主题 */
export const CodeEditor = _component(
  ({ value = _bindable(''), 'aria-label': label, ...rest }: CodeEditorProps) => {
    const config = useConfig();
    let host = _state.raw<HTMLElement | null>(null);
    let editor: PlaygroundEditor | undefined;
    let disposed = false;
    const isDark = () => config.theme.colorScheme === 'dark';

    onMounted(async () => {
      const { createEditor } = await import('./editor');
      // 加载期间离开了页面
      if (disposed || !host) return;
      editor = createEditor(host, {
        code: value,
        dark: isDark(),
        label,
        onChange: (code) => (value = code),
      });
    });
    onBeforeUnmount(() => {
      disposed = true;
      editor?.destroy();
    });
    watch(
      () => value,
      (code) => editor?.setCode(code),
    );
    watch(isDark, (dark) => editor?.setDark(dark));

    return () => (
      <div
        {...mergeAttrs<'div'>({ sx: [controlShellStyles.root, styles.root] }, rest, {
          ref: _toRef(host),
        })}
      />
    );
  },
);
