import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/GlobeProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Network from './demo/Network.tsx?demo';
import Performance from './demo/Performance.tsx?demo';
import Styles from './demo/Styles.tsx?demo';

export const meta = {
  title: 'Globe 地球',
  description:
    '点阵地球：标注地点、画出两地之间流动的弧线，缓缓自转、可以拖动。颜色跟随主题。需要安装 three。',
  order: 7,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Globe } from '@zerodep-dev/vue-tsx-pro-ui/three';">
    <Example id="network" title="标注与弧线" demo={Network}>
      <Code>markers</Code> 是经纬度（北纬、东经为正），画成向外扩散的光圈；<Code>arcs</Code>{' '}
      沿大圆抬离地面，两地越远抬得越高，光点从起点流向终点。拖动转动地球，松手后带着惯性回到自转；
      <Code>center</Code> 决定一开始正对哪里。
    </Example>
    <Example id="styles" title="外观" demo={Styles}>
      陆地来自 Natural Earth 的世界地图，<Code>density</Code>{' '}
      调点的疏密（还会按画质档位缩放）；颜色默认是次要文字色与品牌色，换主题时原地过渡。减少动态效果时停在一帧。
    </Example>
    <Example id="performance" title="画质、降级与叠加内容" demo={Performance}>
      低画质时陆地的点少一半多。<Code>paused</Code> 停住自转与弧线的流动；
      <Code>quality="off"</Code> 不创建 WebGL，显示 <Code>fallback</Code>
      （这里是一个地球图标）。子元素叠在地球上，<Code>propsContent</Code> 给它定位。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
