/**
 * 代码块（pre > code）。高亮器经配置注入（createUi / Provider 的 highlighter，见 config/context.ts），
 * 本组件不依赖 Shiki：没有高亮器、或没给语言时显示纯文本。
 *
 *   <CodeBlock code={source} lang="ts" />
 *
 * 高亮是异步的：先显示纯文本，结果到了再替换；等宽字体下两者排版相同，布局不跳动。
 * 横向可滚动的代码块要能用键盘滚动，所以 pre 可聚焦（tabindex=0，带焦点环）。
 * 右上角有复制按钮（CopyButton）：复制成功后图标变成对勾并经 aria-live 播报“已复制”。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useConfig } from '../config/context';
import { CopyButton, type CopyButtonProps } from './CopyButton';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { focusRingStyles, type StyleTable } from '../utils/style/styles';

/** 未声明的属性落到 pre 上 */
export interface CodeBlockProps extends PartProps<'pre'> {
  /** 代码文本 */
  code: string;
  /** 语言（如 ts、vue、bash），交给高亮器；不写时不高亮，高亮器不认识的语言也按纯文本显示 */
  lang?: string;
  /** 长行自动换行，而不是横向滚动 */
  wrap?: boolean;
  /** 显示复制按钮，默认 true */
  copyable?: boolean;
  /** 内层 code 元素的部件属性 */
  propsCode?: PartProps<'code'>;
  /** 外层（包着 pre 与复制按钮的 div）的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 复制按钮的部件属性 */
  propsCopy?: Partial<CopyButtonProps>;
}

/** CodeBlock 的样式：wrapper、withCopy、copy、root、wrap、code */
export const codeBlockStyles: StyleTable<
  'wrapper' | 'withCopy' | 'copy' | 'root' | 'wrap' | 'code'
> = stylex.create({
  // minWidth: 0：放在 grid / flex 里时外层不被最长的一行代码撑宽（滚动的是里面的 pre）
  wrapper: { position: 'relative', minWidth: 0 },
  // 给复制按钮留出位置，第一行的末尾不被盖住
  withCopy: { paddingInlineEnd: 'calc(_space.md + max(_sizes.control, _sizes.minTarget))' },
  copy: { position: 'absolute', top: '_space.xs', insetInlineEnd: '_space.xs' },
  root: {
    boxSizing: 'border-box',
    margin: 0,
    paddingBlock: '_md',
    paddingInline: '_lg',
    overflowX: 'auto',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderMuted',
    borderRadius: '_md',
    // 不用 fill：亮色主题的 successText、infoText 在 fill 上对比度不到 4.5:1
    backgroundColor: '_surface',
    color: '_text',
    fontFamily: '_mono',
    // 相对周围文字略小：等宽字体的字面显得大；是比例不是字号档位
    fontSize: '0.9em',
    lineHeight: '_normal',
    tabSize: 2,
  },
  wrap: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  // 继承 pre 的字体：浏览器默认给 code 设了 monospace 字号缩放
  code: { fontFamily: 'inherit', fontSize: 'inherit' },
});

/** 代码块（pre > code）：有高亮器与语言时异步高亮，其余时候显示纯文本 */
export const CodeBlock = _component(
  ({
    code,
    lang,
    wrap = false,
    copyable = true,
    propsCode,
    propsRoot,
    propsCopy,
    ...rest
  }: CodeBlockProps) => {
    const config = useConfig();
    // 当前代码的高亮结果；代码或语言变了先清空，回到纯文本
    let html = _state.raw<string | null>(null);

    _effect(() => {
      const highlighter = config.highlighter;
      html = null;
      if (!highlighter || !lang) return;
      let stale = false;
      highlighter(code, lang).then(
        (result) => {
          if (!stale) html = result;
        },
        (error: unknown) => console.error(`CodeBlock 高亮 ${lang} 代码失败，显示纯文本`, error),
      );
      return () => (stale = true);
    });

    return () => {
      const codeProps = elementProps(mergeProps<'code'>({ sx: codeBlockStyles.code }, propsCode));
      return (
        <div {...elementProps(mergeProps<'div'>({ sx: codeBlockStyles.wrapper }, propsRoot))}>
          <pre
            {...elementProps(
              mergeProps<'pre'>(
                {
                  sx: [
                    codeBlockStyles.root,
                    focusRingStyles.visible,
                    copyable && codeBlockStyles.withCopy,
                  ],
                  tabindex: 0,
                },
                rest,
                { sx: wrap && codeBlockStyles.wrap },
              ),
            )}
            data-lang={lang}
          >
            {html == null ? (
              <code {...codeProps}>{code}</code>
            ) : (
              <code {...codeProps} innerHTML={html} />
            )}
          </pre>
          {copyable && (
            <CopyButton
              {...mergePartProps<CopyButtonProps>(
                { sx: codeBlockStyles.copy, size: 'sm', tone: 'neutral', value: code },
                propsCopy,
              )}
            />
          )}
        </div>
      );
    };
  },
);
