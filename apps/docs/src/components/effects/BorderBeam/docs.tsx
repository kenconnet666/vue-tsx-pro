import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/BorderBeamProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Basic from './demo/Basic.tsx?demo';
import Variants from './demo/Variants.tsx?demo';

export const meta = {
  title: 'BorderBeam 流光边框',
  description:
    '一段渐变的光沿着容器的边框循环流动，用来强调一张卡片、一个输入区。纯 CSS 动画，不依赖 WebGL。',
  order: 12,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { BorderBeam } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="基础用法" demo={Basic}>
          放进一个定位的容器（这里给 <Code>Card</Code> 加了 <Code>position: relative</Code>
          ），它铺满容器、只在边框那一圈可见。颜色默认从品牌色到图表色板的紫色，跟随主题。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="variants" title="多条、长度与圆角" demo={Variants}>
          <Code>delay</Code> 与 <Code>reverse</Code> 让几条光带错开；<Code>size</Code>、
          <Code>borderWidth</Code>、<Code>duration</Code> 调长度、粗细与速度。<Code>radius</Code>{' '}
          要与容器的圆角一致（默认主题的 lg，与 Card 相同）。减少动态效果时光带停在起点。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
