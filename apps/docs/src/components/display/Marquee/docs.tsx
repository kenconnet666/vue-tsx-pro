import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/MarqueeProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Notice from './demo/Notice.tsx?demo';
import Partners from './demo/Partners.tsx?demo';

export const meta = {
  title: 'Marquee 跑马灯',
  description:
    '内容无缝循环滚动（合作伙伴、标签墙、公告）：纯 CSS 动画，四个方向，悬停暂停，减少动态效果时不滚动。',
  order: 9,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Marquee } from '@vue-tsx-pro/ui';">
    <Examples>
      <Example id="partners" title="合作伙伴与标签墙" demo={Partners}>
        内容复制一份接在后面，平移一份的长度时正好与开头重合。<Code>speed</Code>{' '}
        是每秒多少像素，内容多少都一样快；<Code>fade</Code> 两端渐隐；指针悬停、焦点在里面时暂停。
        复制的那份对读屏隐藏，读屏只念一遍。
      </Example>
      <Example id="notice" title="竖向公告" demo={Notice}>
        <Code>direction="up"</Code> 竖向滚动，高度由 <Code>sx</Code>{' '}
        给。会一直动的内容要给用户暂停的办法（WCAG 2.2.2）：<Code>paused</Code> 由外部的按钮控制。
      </Example>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
