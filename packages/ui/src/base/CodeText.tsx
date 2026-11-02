/**
 * 带行内代码的一段文字：反引号包起来的部分渲染成 Code，文案写在数据里时不用拆成多个节点。
 *
 *   <CodeText text="`where` 里写数组就是 AND" />
 *
 * 只认成对的反引号，不是 Markdown；要标题、列表、链接就直接写组件。多出来的一个反引号后面的文字按代码显示，写文案时要成对。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, type CodeProps } from './Code';

/** CodeText 的属性 */
export interface CodeTextProps {
  /** 文字：反引号里的是行内代码 */
  text: string;
  /** 行内代码的部件属性 */
  propsCode?: Partial<CodeProps>;
}

/** 带行内代码的一段文字 */
export const CodeText = _component(({ text, propsCode }: CodeTextProps) => () => (
  <>
    {text
      .split('`')
      .map((part, index) => (index % 2 === 1 ? <Code {...propsCode}>{part}</Code> : part))}
  </>
));
