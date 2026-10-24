/**
 * 长文的容器（article）：段落、标题、列表、代码块、表格依次排下来时的间距、行长与行高。
 * 样式里不写“相邻元素之间”的选择器，间距用 flex 的 gap 统一给：子元素各自不带外边距（本库的组件都是这样）。
 *
 *   <Prose>
 *     <H1 id="intro" anchor>介绍</H1>
 *     <Paragraph>…</Paragraph>
 *     <CodeBlock code={…} lang="ts" />
 *   </Prose>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';
import { gapStyles, type Space } from '../utils/style/styles';

/** 未声明的属性落到 article 上 */
export interface ProseProps extends PartProps<'article'> {
  /** 块之间的间距，默认 lg（1em） */
  gap?: Space;
  /** 限制行长（约 70 个字宽），默认 true；放在窄栏里时可以关掉 */
  measure?: boolean;
  children?: VNodeChild;
}

/** Prose 的样式 */
export const proseStyles = css.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    lineHeight: '_relaxed',
    overflowWrap: 'break-word',
  },
  measure: { maxWidth: '70ch' },
});

/** 长文的容器：块之间的间距、行长与宽松的行高 */
export const Prose = _component(
  ({ gap = 'lg', measure = true, children, ...rest }: ProseProps) =>
    () => (
      <article
        {...mergeAttrs<'article'>(
          { sx: [proseStyles.root, gapStyles[gap], measure && proseStyles.measure] },
          rest,
        )}
      >
        {children}
      </article>
    ),
);
