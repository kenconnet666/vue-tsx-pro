import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import blockquoteApi from 'virtual:api/BlockquoteProps';
import headingApi from 'virtual:api/HeadingProps';
import kbdApi from 'virtual:api/KbdProps';
import linkApi from 'virtual:api/LinkProps';
import markApi from 'virtual:api/MarkProps';
import api from 'virtual:api/TextProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Headings from './demo/Headings.tsx?demo';
import Inline from './demo/Inline.tsx?demo';
import Links from './demo/Links.tsx?demo';
import Overflow from './demo/Overflow.tsx?demo';
import Scale from './demo/Scale.tsx?demo';
import Tones from './demo/Tones.tsx?demo';

export const meta = {
  title: 'Text 文字',
  description:
    '正文、链接与标题：字号、字重、色调、截断与换行；Paragraph、Strong、Em、Small、Link、Mark、Kbd、Blockquote、H1–H6。',
  order: 0,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Text, Paragraph, Strong, Em, Small, Link, Mark, Kbd, Blockquote, H1, H2 } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <Example id="scale" title="字号与字重" demo={Scale}>
        <Code>size</Code> 对应主题的字号档位，<Code>weight</Code> 对应字重；不写时继承上下文，
        <Code>Small</Code> 默认 xs，<Code>Strong</Code> 默认 semibold。
      </Example>
      <Example id="tones" title="色调" demo={Tones}>
        <Code>tone</Code> 取主题的文字色：muted
        用于次要说明，其余是品牌色与提示色的文字色，在每套主题下都通过对比度检查。
      </Example>
      <Example id="overflow" title="截断与换行" demo={Overflow}>
        <Code>truncate</Code> 单行省略，<Code>lineClamp</Code> 限制行数；<Code>wrap</Code> 的 pretty
        避免最后一行只剩一个字（Paragraph 默认），balance 让标题各行长度均衡。
      </Example>
      <Example id="inline" title="行内语义" demo={Inline}>
        一个元素一个组件：<Code>Strong</Code>、<Code>Em</Code>、<Code>Small</Code>、
        <Code>Mark</Code>（高亮）、<Code>Kbd</Code>（按键）、<Code>Code</Code>
        （行内代码）、<Code>Blockquote</Code>（引用）。
      </Example>
      <Example id="links" title="链接" demo={Links}>
        <Code>Link</Code> 默认带下划线（WCAG
        1.4.1：正文里的链接不能只靠颜色区分）；导航这类上下文明确的地方可以
        <Code>underline="hover"</Code> 或 none。按钮样式的链接用 LinkButton。
      </Example>
      <Example id="headings" title="标题" demo={Headings}>
        H1–H6 是六个组件，默认字号依次减小；级别要连续，视觉层级用 <Code>size</Code> 单独改。
        <Code>anchor</Code> 加指向本节的锚点链接。
      </Example>
    </Examples>
    <ApiReference api={[api, headingApi, linkApi, markApi, kbdApi, blockquoteApi]} />
  </DocPage>
));
