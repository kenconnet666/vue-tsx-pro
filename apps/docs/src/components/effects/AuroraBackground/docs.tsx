import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/AuroraBackgroundProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Controls from './demo/Controls.tsx?demo';
import Night from './demo/Night.tsx?demo';
import Welcome from './demo/Welcome.tsx?demo';

export const meta = {
  title: 'AuroraBackground 极光',
  description:
    '几层半透明的光幕缓缓飘动，下缘清晰、向上渐隐。背景透明：暗色主题里是夜空的极光，亮色主题里是一层彩色的雾。需要安装 three。',
  order: 2,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { AuroraBackground } from '@vue-tsx-pro/ui/three';">
    <Examples>
      <ExampleColumn>
        <Example id="night" title="夜空" demo={Night}>
          包在 <Code>Provider</Code>{' '}
          里用暗色主题，光幕叠在主题的底色上；子元素是叠在上面的内容。暗色主题里光更亮（着色器里有{' '}
          <Code>uDark</Code>），亮色主题里收敛成雾，不抢文字。
        </Example>
        <Example id="welcome" title="叠加内容与关闭特效" demo={Welcome}>
          卡片是子元素，叠在光幕上面。<Code>interactive</Code> 关掉时光幕不随指针偏移，
          <Code>paused</Code> 停在当前画面；用户在设置里关掉动态背景时给 <Code>quality="off"</Code>
          ：不创建 WebGL，显示 <Code>fallback</Code>
          （这里是一抹静态渐变，不写时是主题色的柔和渐变）。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="controls" title="色板、亮度与高度" demo={Controls}>
          这一块跟随站点的主题，切换右上角的主题看看。<Code>height</Code> 是光幕下缘的位置（0
          底部、1 顶部），<Code>intensity</Code> 是亮度；指针左右移动时光幕跟着偏移。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
