/**
 * 代码块（pre > code）。高亮器经配置注入（createUi / Provider 的 highlighter，见 config/context.ts），
 * 本组件不依赖 Shiki：没有高亮器、或没给语言时显示纯文本。
 *
 *   <CodeBlock code={source} lang="ts" />
 *   <CodeBlock code={source} lang="ts" title="main.ts" lineNumbers highlightLines="2,4-5" maxLines={20} />
 *
 * - 高亮是异步的：先显示纯文本，结果到了再替换；等宽字体下两者排版相同，布局不跳动。
 * - 横向可滚动的代码块要能用键盘滚动，所以 pre 可聚焦（tabindex=0，带焦点环）。
 * - 复制按钮（CopyButton）在右上角，有标题时放在标题栏里；复制成功后经 aria-live 播报“已复制”。
 * - 行号、行高亮、新增与删除的行：按行渲染（高亮结果按 <br> 拆行；代码里的 < 都已转义，拆分是安全的）；
 *   都不用时整段写进 innerHTML，不为每行建节点。行号不可选中，复制的是 code 本身。
 * - 长代码：maxLines 之外折叠，底部的按钮展开或收起。
 */
import { ChevronDown } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useConfig, useLang } from '../config/context';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { disclosureStyles } from '../utils/style/transitions';
import { ButtonBase, type ButtonBaseProps } from './ButtonBase';
import { CopyButton, type CopyButtonProps } from './CopyButton';
import { Icon } from './Icon';

/** 行号的写法：`'1,3-5'` 或 `[1, 3, 4, 5]`（从 1 开始） */
export type LineSpec = string | readonly number[];

/** 未声明的属性落到 pre 上；原生的 title 属性（悬停提示）让给标题栏 */
export interface CodeBlockProps extends PartProps<'pre', 'title'> {
  /** 代码文本 */
  code: string;
  /** 语言（如 ts、vue、bash），交给高亮器；不写时不高亮，高亮器不认识的语言也按纯文本显示 */
  lang?: string;
  /** 标题栏：通常是文件名；有标题时复制按钮放在标题栏里 */
  title?: VNodeChild;
  /** 长行自动换行，而不是横向滚动 */
  wrap?: boolean;
  /** 显示复制按钮，默认 true */
  copyable?: boolean;
  /** 显示行号 */
  lineNumbers?: boolean;
  /** 强调的行：`'2,4-5'` */
  highlightLines?: LineSpec;
  /** 新增的行（diff）：绿色底 */
  addedLines?: LineSpec;
  /** 删除的行（diff）：红色底 */
  removedLines?: LineSpec;
  /** 超过这么多行时折叠，底部的按钮展开；不写时不折叠 */
  maxLines?: number;
  /** 内层 code 元素的部件属性 */
  propsCode?: PartProps<'code'>;
  /** 外层（包着标题栏、pre 与复制按钮的 div）的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 标题栏的部件属性 */
  propsHeader?: PartProps<'div'>;
  /** 复制按钮的部件属性 */
  propsCopy?: Partial<CopyButtonProps>;
  /** 展开、收起长代码的按钮的部件属性 */
  propsExpand?: Partial<ButtonBaseProps>;
}

/** `'1,3-5'` → Set{1, 3, 4, 5}；数组原样收进集合 */
export function parseLineSpec(spec: LineSpec | undefined): Set<number> {
  if (spec == null) return new Set();
  if (typeof spec !== 'string') return new Set(spec);
  const lines = new Set<number>();
  for (const part of spec.split(',')) {
    const [from, to = from] = part.split('-').map((text) => Number(text.trim()));
    if (!Number.isInteger(from) || !Number.isInteger(to)) continue;
    for (let line = from!; line <= to!; line++) lines.add(line);
  }
  return lines;
}

/** CodeBlock 的样式 */
export const codeBlockStyles = stylex.create({
  // minWidth: 0：放在 grid / flex 里时外层不被最长的一行代码撑宽（滚动的是里面的 pre）
  wrapper: {
    minWidth: 0,
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderMuted',
    borderRadius: '_md',
    backgroundColor: '_surface',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    minHeight: 'max(_sizes.control, _sizes.minTarget)',
    paddingInlineStart: '_lg',
    paddingInlineEnd: '_xs',
    borderBottomWidth: '_xs',
    borderBottomStyle: 'solid',
    borderBottomColor: '_borderMuted',
    backgroundColor: '_surfaceMuted',
    color: '_textMuted',
    fontFamily: '_mono',
    fontSize: '0.85em',
  },
  title: {
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  body: { position: 'relative' },
  // 给复制按钮留出位置，第一行的末尾不被盖住
  withCopy: { paddingInlineEnd: 'calc(_space.md + max(_sizes.control, _sizes.minTarget))' },
  copy: { position: 'absolute', top: '_space.xs', insetInlineEnd: '_space.xs' },
  root: {
    boxSizing: 'border-box',
    margin: 0,
    paddingBlock: '_md',
    paddingInline: '_lg',
    overflowX: 'auto',
    color: '_text',
    fontFamily: '_mono',
    // 代码字体的连字（=> 显示成 ⇒）会让照着抄的人看错，一律关掉
    fontVariantLigatures: 'none',
    // 相对周围文字略小：等宽字体的字面显得大；是比例不是字号档位
    fontSize: '0.9em',
    lineHeight: '_normal',
    tabSize: 2,
  },
  collapsed: { overflowY: 'hidden' },
  wrap: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  // 继承 pre 的字体：浏览器默认给 code 设了 monospace 字号缩放
  code: { fontFamily: 'inherit', fontSize: 'inherit' },
  // 按行渲染时：code 至少与 pre 一样宽，行的底色铺满横向滚动的整行
  lines: { display: 'inline-block', minWidth: '100%' },
  line: {
    display: 'block',
    minHeight: '1lh',
    marginInline: 'calc(-1 * _space.lg)',
    paddingInline: '_lg',
  },
  highlighted: { backgroundColor: '_fill' },
  added: { backgroundColor: '_codeInserted' },
  removed: { backgroundColor: '_codeDeleted' },
  lineNumber: {
    display: 'inline-block',
    minWidth: '2ch',
    marginInlineEnd: '_lg',
    color: '_codeComment',
    textAlign: 'end',
    userSelect: 'none',
  },
  expand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '_xs',
    width: '_full',
    minHeight: 'max(_sizes.control, _sizes.minTarget)',
    borderTopWidth: '_xs',
    borderTopStyle: 'solid',
    borderTopColor: '_borderMuted',
    backgroundColor: { default: '_surfaceMuted', ':hover': '_fill' },
    color: '_textMuted',
    fontSize: '_sm',
  },
  expandOpen: { rotate: '180deg' },
});

// 折叠后的高度按行数算，是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** CodeBlock 的动态样式：折叠后的最大高度 */
export const codeBlockDynamicStyles = stylex.create({
  maxLines: (lines: number) => ({ maxHeight: `calc(${lines} * 1lh + 2 * 0.75em)` }),
});

/** 代码块：高亮、复制、标题栏、行号、行高亮、diff、长代码折叠 */
export const CodeBlock = _component(
  ({
    code,
    lang,
    title,
    wrap = false,
    copyable = true,
    lineNumbers = false,
    highlightLines,
    addedLines,
    removedLines,
    maxLines,
    propsCode,
    propsRoot,
    propsHeader,
    propsCopy,
    propsExpand,
    ...rest
  }: CodeBlockProps) => {
    const config = useConfig();
    const labels = useLang();
    // 当前代码的高亮结果；代码或语言变了先清空，回到纯文本
    let html = _state.raw<string | null>(null);
    let expanded = _state(false);

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

    const marks = _derived.by(() => ({
      highlighted: parseLineSpec(highlightLines),
      added: parseLineSpec(addedLines),
      removed: parseLineSpec(removedLines),
    }));
    const lineCount = _derived(code.split('\n').length);
    const byLine = _derived(
      lineNumbers || marks.highlighted.size + marks.added.size + marks.removed.size > 0,
    );

    /** 按行渲染：高亮结果按 <br> 拆，纯文本按换行拆 */
    function renderLines() {
      const lines = html == null ? code.split('\n') : html.split('<br>');
      return lines.map((line, index) => {
        const number = index + 1;
        return (
          <span
            key={number}
            {...stylex.attrs(
              codeBlockStyles.line,
              marks.highlighted.has(number) && codeBlockStyles.highlighted,
              marks.added.has(number) && codeBlockStyles.added,
              marks.removed.has(number) && codeBlockStyles.removed,
            )}
            data-diff={
              marks.added.has(number) ? 'added' : marks.removed.has(number) ? 'removed' : undefined
            }
          >
            {lineNumbers && (
              <span {...stylex.attrs(codeBlockStyles.lineNumber)} aria-hidden="true">
                {number}
              </span>
            )}
            {html == null ? line : <span innerHTML={line} />}
          </span>
        );
      });
    }

    return () => {
      const collapsible = maxLines != null && lineCount > maxLines;
      const collapsed = collapsible && !expanded;
      const codeProps = mergeAttrs<'code'>(
        { sx: [codeBlockStyles.code, byLine && codeBlockStyles.lines] },
        propsCode,
      );
      const copyButton = (inHeader: boolean) => (
        <CopyButton
          {...mergePartProps<CopyButtonProps>(
            { sx: !inHeader && codeBlockStyles.copy, size: 'sm', tone: 'neutral', value: code },
            propsCopy,
          )}
        />
      );
      return (
        <div {...mergeAttrs<'div'>({ sx: codeBlockStyles.wrapper }, propsRoot)}>
          {title != null && (
            <div {...mergeAttrs<'div'>({ sx: codeBlockStyles.header }, propsHeader)}>
              <span {...stylex.attrs(codeBlockStyles.title)}>{title}</span>
              {copyable && copyButton(true)}
            </div>
          )}
          <div {...stylex.attrs(codeBlockStyles.body)}>
            <pre
              {...mergeAttrs<'pre'>(
                {
                  sx: [
                    codeBlockStyles.root,
                    focusRingStyles.visible,
                    copyable && title == null && codeBlockStyles.withCopy,
                  ],
                  tabindex: 0,
                },
                rest,
                {
                  sx: [
                    wrap && codeBlockStyles.wrap,
                    collapsed && [
                      codeBlockStyles.collapsed,
                      codeBlockDynamicStyles.maxLines(maxLines!),
                    ],
                  ],
                },
              )}
              data-lang={lang}
            >
              {byLine ? (
                <code {...codeProps}>{renderLines()}</code>
              ) : html == null ? (
                <code {...codeProps}>{code}</code>
              ) : (
                <code {...codeProps} innerHTML={html} />
              )}
            </pre>
            {copyable && title == null && copyButton(false)}
          </div>
          {collapsible && (
            <ButtonBase
              {...mergePartProps<ButtonBaseProps>({ sx: codeBlockStyles.expand }, propsExpand, {
                'aria-expanded': expanded,
                onClick: () => (expanded = !expanded),
              })}
            >
              {expanded ? labels.codeCollapse : labels.codeExpand}
              <Icon
                icon={ChevronDown}
                sx={[disclosureStyles.icon, expanded && codeBlockStyles.expandOpen]}
              />
            </ButtonBase>
          )}
        </div>
      );
    };
  },
);
