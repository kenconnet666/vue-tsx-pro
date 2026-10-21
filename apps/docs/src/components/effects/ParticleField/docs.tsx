import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ParticleFieldProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Constellation from './demo/Constellation.tsx?demo';
import Controls from './demo/Controls.tsx?demo';
import Layered from './demo/Layered.tsx?demo';

export const meta = {
  title: 'ParticleField 粒子场',
  description:
    '柔和的光点缓缓漂移，指针靠近时向四周排开；可选星座般的连线。背景透明，可以叠在别的效果上。需要安装 three。',
  order: 3,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { ParticleField } from '@vue-tsx-pro/ui/three';">
    <Examples>
      <ExampleColumn>
        <Example id="constellation" title="星座连线" demo={Constellation}>
          <Code>links</Code> 把距离在 <Code>linkDistance</Code>{' '}
          以内的粒子连起来，越近越清楚。粒子颜色从色板里随机分配，连线用第一个颜色（默认品牌色）。在卡片之间移动指针试试。
        </Example>
        <Example id="layered" title="叠在渐变上" demo={Layered}>
          效果可以互相嵌套：粒子场作为 <Code>MeshGradient</Code>{' '}
          的内容铺满整块，用反色的文字色作粒子与连线的颜色。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="controls" title="数量、大小与速度" demo={Controls}>
          不写 <Code>count</Code>{' '}
          时按面积与画质档位决定粒子数（连线时更稀疏），尺寸变化时增减。属性都实时生效；
          <Code>links</Code> 与 <Code>palette</Code> 变了会重建场景。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
