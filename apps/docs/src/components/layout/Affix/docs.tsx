import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/AffixProps';
import backTopApi from 'virtual:api/BackTopProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Toolbar from './demo/Toolbar.tsx?demo';

export const meta = {
  title: 'Affix 固钉与回到顶部',
  description:
    '滚动时贴住视口顶部或底部的操作条（Affix），长页面滚下去后出现的回到顶部按钮（BackTop）。',
  order: 10,
};

export default _component(() => () => (
  <DocPage meta={meta} imports="import { Affix, BackTop } from '@vue-tsx-pro/ui';">
    <Example id="affix" title="滚动面板里的操作条" demo={Toolbar}>
      <Code>Affix</Code> 用 CSS 的 <Code>position: sticky</Code>
      ：在所在的那一层里贴住，不脱离文档流（不用占位、不用量宽度），那一层滚出去时跟着走。
      <Code>offsetTop</Code> 是贴住时离顶部多远（整页时让开顶栏），<Code>offsetBottom</Code>{' '}
      贴在底部（表单的提交栏）。祖先里有 overflow 不是 visible 的元素（这里的示例面板）时，sticky
      相对它贴住，把它作为 <Code>target</Code> 传进来。是否贴住由 IntersectionObserver
      看一个零高度的哨兵：贴住时加阴影、写 data-stuck，并报告 <Code>onChange</Code>。
      <Code>BackTop</Code> 在整页（或 <Code>target</Code> 给的容器）滚过 <Code>threshold</Code>{' '}
      后出现在右下角，点了平滑滚回顶部（减少动态效果时直接跳回），焦点也回到开头。
    </Example>
    <ApiReference api={[api, backTopApi]} />
  </DocPage>
));
