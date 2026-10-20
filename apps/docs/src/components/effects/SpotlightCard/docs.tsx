import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/SpotlightCardProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Colors from './demo/Colors.tsx?demo';
import Features from './demo/Features.tsx?demo';

export const meta = {
  title: 'SpotlightCard 聚光卡片',
  description:
    '一团柔和的光跟着指针，靠近边框的地方把边框也点亮，离开后淡出。纯 CSS 与弹簧，不依赖 WebGL。',
  order: 11,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { SpotlightCard } from '@vue-tsx-pro/ui';">
    <Examples>
      <Example id="features" title="特性网格" demo={Features}>
        一组卡片并排时，光从一张滑到下一张。光层很淡、不接收指针，不影响内容的对比度与交互。
      </Example>
      <Example id="colors" title="颜色、大小与边框" demo={Colors}>
        <Code>color</Code> 接受 token 或 CSS 颜色（默认品牌色），<Code>size</Code> 是光斑的半径；
        <Code>border</Code> 关掉时只照亮表面（最后一张）。
      </Example>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
