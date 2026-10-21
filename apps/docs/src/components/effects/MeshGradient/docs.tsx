import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/MeshGradientProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Controls from './demo/Controls.tsx?demo';
import Hero from './demo/Hero.tsx?demo';
import Palettes from './demo/Palettes.tsx?demo';

export const meta = {
  title: 'MeshGradient 网格渐变',
  description:
    '品牌色板的光斑缓慢游走、柔和融合，带噪声扭曲与细颗粒；跟随主题实时过渡。适合首页标题区、登录页、封面。需要安装 three。',
  order: 1,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { MeshGradient } from '@vue-tsx-pro/ui/three';">
    <Examples>
      <ExampleColumn>
        <Example id="hero" title="标题区" demo={Hero}>
          子元素叠在渐变上面，照常排版与交互；画布在底层，不接收指针，指针跟随监听的是整个窗口。画面不透明，文字放在半透明的面板上保证对比度。尺寸由{' '}
          <Code>sx</Code> 或内容决定。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="palettes" title="色板" demo={Palettes}>
          <Code>palette</Code> 接受 2–6 个 token 或 CSS 颜色，默认是品牌色加图表色板的紫、粉、青。用
          token 时切换主题会原地过渡到新色，不重建场景。
        </Example>
        <Example id="controls" title="速度、扭曲与颗粒" demo={Controls}>
          <Code>speed</Code>、<Code>distortion</Code>、<Code>grain</Code> 实时生效；
          <Code>paused</Code> 停在当前画面。系统要求减少动态效果时只画一帧静止画面。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
