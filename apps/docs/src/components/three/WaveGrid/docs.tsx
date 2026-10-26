import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/WaveGridProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Banner from './demo/Banner.tsx?demo';
import Performance from './demo/Performance.tsx?demo';
import Variants from './demo/Variants.tsx?demo';

export const meta = {
  title: 'WaveGrid 线框地形',
  description:
    '一张向远处延伸的网格随噪声起伏，指针所在处隆起；按高度取主题色板的颜色，远处渐隐。需要安装 three。',
  order: 4,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { WaveGrid } from '@zerodep-dev/vue-tsx-pro-ui/three';">
    <Examples>
      <ExampleColumn>
        <Example id="banner" title="横幅" demo={Banner}>
          背景透明，这里根元素用了一层从 <Code>surfaceMuted</Code> 到 <Code>background</Code>{' '}
          的渐变；网格在底层，子元素叠在上面。
        </Example>
        <Example id="performance" title="画质、分辨率与降级" demo={Performance}>
          低画质时网格更粗、不抗锯齿；<Code>resolution</Code> 降低渲染分辨率。
          <Code>interactive</Code> 关掉指针下的隆起，<Code>paused</Code> 停在当前画面；
          <Code>quality="off"</Code> 不创建 WebGL，显示 <Code>fallback</Code>（这里是一层 CSS
          点阵）。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="variants" title="画法与色板" demo={Variants}>
          <Code>variant</Code> 是网格线（grid）或只画交点（dots）；<Code>palette</Code>{' '}
          的第一个颜色在低处、最后一个在高处。<Code>amplitude</Code>、<Code>speed</Code>{' '}
          调起伏的高度与快慢；细分程度随画质档位变化。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
