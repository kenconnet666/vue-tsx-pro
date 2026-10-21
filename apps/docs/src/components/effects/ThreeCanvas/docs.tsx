import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ThreeCanvasProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Basic from './demo/Basic.tsx?demo';
import Pointer from './demo/Pointer.tsx?demo';
import Quality from './demo/Quality.tsx?demo';
import ThemeColors from './demo/ThemeColors.tsx?demo';

export const meta = {
  title: 'ThreeCanvas 3D 画布',
  description:
    'three.js 场景的底座：渲染器的创建与释放、尺寸跟随、滚出视口暂停、主题色接入、画质档位与降级。本分类的 3D 效果都建在它上面；需要安装 three。',
  order: 0,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { ThreeCanvas } from '@vue-tsx-pro/ui/three';">
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="基础用法" demo={Basic}>
          <Code>setup</Code> 里往 <Code>scene</Code> 加物体，返回的 <Code>frame</Code>{' '}
          每帧调用。画布第一次进入视口时才创建渲染器，滚出视口、切到别的标签页时停下；卸载时释放几何体、材质、纹理与渲染器。
          <Code>themeColors</Code> 把主题 token 转成 three.js
          的颜色，直接赋给材质，切换主题时原地过渡到新色。
        </Example>
        <Example id="theme" title="跟随主题" demo={ThemeColors}>
          颜色在画布所在位置读取，所以包在 <Code>Provider</Code>{' '}
          里的局部主题同样生效；切换时按主题的时长与缓动过渡，减少动态效果时直接换。小球用图表色板
          <Code>chart1</Code>–<Code>chart8</Code>，中间的球是品牌色。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="quality" title="画质与暂停" demo={Quality}>
          <Code>quality</Code> 决定像素比上限、密度系数（这里按它决定粒子数）与抗锯齿；
          <Code>auto</Code> 按设备选择（触屏、核数、内存、省流量）。<Code>paused</Code>{' '}
          停在当前画面。页面上同时保持的 WebGL 上下文默认最多 8
          个，超出时回收最久没出现在视口里的画布，它滚回来时重建。
        </Example>
        <Example id="pointer" title="指针跟随" demo={Pointer}>
          上下文里的 <Code>pointer</Code> 是指针相对画布的位置（-1 到 1）与 <Code>strength</Code>
          （指针离开时淡出），经过弹簧阻尼；监听整个窗口，画布在内容下面时也能跟随。画布以外的元素用{' '}
          <Code>usePointer(() =&gt; 元素)</Code>。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
