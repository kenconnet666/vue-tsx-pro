import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import auroraApi from 'virtual:api/AuroraBackgroundProps';
import meshApi from 'virtual:api/MeshGradientProps';
import particleApi from 'virtual:api/ParticleFieldProps';
import api from 'virtual:api/ShaderBackgroundProps';
import waveApi from 'virtual:api/WaveGridProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import AuroraControls from './demo/AuroraControls.tsx?demo';
import AuroraNight from './demo/AuroraNight.tsx?demo';
import Basic from './demo/Basic.tsx?demo';
import MeshControls from './demo/MeshControls.tsx?demo';
import MeshHero from './demo/MeshHero.tsx?demo';
import Overlay from './demo/Overlay.tsx?demo';
import ParticleConstellation from './demo/ParticleConstellation.tsx?demo';
import ParticleControls from './demo/ParticleControls.tsx?demo';
import ParticleLayered from './demo/ParticleLayered.tsx?demo';
import Performance from './demo/Performance.tsx?demo';
import Uniforms from './demo/Uniforms.tsx?demo';
import WaveBanner from './demo/WaveBanner.tsx?demo';
import WaveVariants from './demo/WaveVariants.tsx?demo';

export const meta = {
  title: 'ShaderBackground 背景特效',
  description:
    '标题区、登录页、封面的动态背景：网格渐变（MeshGradient）、极光（AuroraBackground）、粒子场（ParticleField）、线框地形（WaveGrid），都跟随主题色；也可以用 ShaderBackground 自己写一个片段着色器。需要安装 three。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { AuroraBackground, MeshGradient, ParticleField, ShaderBackground, WaveGrid } from '@zerodep-dev/vue-tsx-pro-ui/three';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="mesh-gradient" title="网格渐变：标题区" demo={MeshHero}>
          <Code>MeshGradient</Code>{' '}
          是品牌色板的光斑缓慢游走、柔和融合，带噪声扭曲与细颗粒。子元素叠在渐变上面，照常排版与交互；画布在底层，不接收指针，指针跟随监听的是整个窗口。画面不透明，文字放在半透明的面板上保证对比度。尺寸由{' '}
          <Code>sx</Code> 或内容决定。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="mesh-gradient-controls" title="网格渐变：色板与参数" demo={MeshControls}>
          <Code>palette</Code> 接受 2–6 个 token 或 CSS 颜色，默认是品牌色加图表色板的紫、粉、青。用
          token 时切换主题会原地过渡到新色，不重建场景。<Code>speed</Code>、<Code>distortion</Code>
          、<Code>grain</Code> 实时生效。渲染分辨率默认 <Code>0.5</Code>
          ：平滑的渐变降到一半看不出差别，填充开销省下四分之三。
        </Example>
      </ExampleColumn>
    </Examples>
    <Examples>
      <ExampleColumn>
        <Example id="aurora" title="极光：夜空" demo={AuroraNight}>
          <Code>AuroraBackground</Code>{' '}
          是几层半透明的光幕缓缓飘动，下缘清晰、向上渐隐，背景透明。这里包在 <Code>Provider</Code>{' '}
          里用暗色主题，光幕叠在主题的底色上；暗色主题里光更亮（着色器里有 <Code>uDark</Code>
          ），亮色主题里收敛成雾，不抢文字。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="aurora-controls" title="极光：色板、亮度与高度" demo={AuroraControls}>
          这一块跟随站点的主题，切换右上角的主题看看。<Code>height</Code> 是光幕下缘的位置（0
          底部、1 顶部），<Code>intensity</Code> 是亮度；指针左右移动时光幕跟着偏移。
        </Example>
      </ExampleColumn>
    </Examples>
    <Examples>
      <ExampleColumn>
        <Example id="particle-field" title="粒子场：星座连线" demo={ParticleConstellation}>
          <Code>ParticleField</Code> 是柔和的光点缓缓漂移，指针靠近时向四周排开，背景透明。
          <Code>links</Code> 把距离在 <Code>linkDistance</Code>{' '}
          以内的粒子连起来，越近越清楚。粒子颜色从色板里随机分配，连线用第一个颜色（默认品牌色）。在卡片之间移动指针试试。
        </Example>
        <Example id="particle-layered" title="粒子场：叠在渐变上" demo={ParticleLayered}>
          效果可以互相嵌套：粒子场作为 <Code>MeshGradient</Code>{' '}
          的内容铺满整块，用反色的文字色作粒子与连线的颜色。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="particle-controls" title="粒子场：数量、大小与速度" demo={ParticleControls}>
          不写 <Code>count</Code>{' '}
          时按面积与画质档位决定粒子数（连线时更稀疏，低画质不到高画质的一半），尺寸变化时增减。属性都实时生效；
          <Code>links</Code> 与 <Code>palette</Code> 变了会重建场景。
          <Code>repelRadius</Code> 是指针排开粒子的半径（px）。
        </Example>
      </ExampleColumn>
    </Examples>
    <Examples>
      <ExampleColumn>
        <Example id="wave-grid" title="线框地形：横幅" demo={WaveBanner}>
          <Code>WaveGrid</Code>{' '}
          是一张向远处延伸的网格随噪声起伏，指针所在处隆起，远处渐隐。背景透明，这里根元素用了一层从{' '}
          <Code>surfaceMuted</Code> 到 <Code>background</Code> 的渐变；网格在底层，子元素叠在上面。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="wave-grid-variants" title="线框地形：画法与色板" demo={WaveVariants}>
          <Code>type</Code> 是网格线（grid）或只画交点（dots）；<Code>palette</Code>{' '}
          的第一个颜色在低处、最后一个在高处。<Code>amplitude</Code>、<Code>speed</Code>{' '}
          调起伏的高度与快慢；细分程度随画质档位变化，低画质时网格更粗、不抗锯齿。
        </Example>
      </ExampleColumn>
    </Examples>
    <Examples>
      <ExampleColumn>
        <Example id="content" title="叠加内容与关闭特效" demo={Overlay}>
          所有效果共有：子元素叠在画布上面，照常排版、可以交互；外层要给高度或让内容撑开，
          <Code>propsContent</Code> 给内容外层加样式。<Code>interactive</Code> 关掉时不随指针变化，
          <Code>paused</Code> 停在当前画面；用户在设置里关掉动态背景时给 <Code>quality="off"</Code>
          ：不创建 WebGL，显示 <Code>fallback</Code>
          （这里是一抹静态渐变，不写时是主题色的柔和渐变）。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="performance" title="画质、分辨率与降级" demo={Performance}>
          所有效果共有：<Code>quality</Code> 是画质档位（像素比上限、粒子密度、抗锯齿），
          <Code>off</Code> 不创建 WebGL、直接显示 <Code>fallback</Code>（没有 WebGL 时也显示它）；
          <Code>resolution</Code>{' '}
          按比例降低渲染分辨率。滚出视口、切到别的标签页时自动停下；系统要求减少动态效果时只画一帧静止画面。
        </Example>
      </ExampleColumn>
    </Examples>
    <Examples>
      <ExampleColumn>
        <Example id="shader" title="自己写着色器" demo={Basic}>
          上面几种都建在 <Code>ShaderBackground</Code> 上。<Code>fragmentShader</Code> 只写{' '}
          <Code>vec4 shade(vec2 uv)</Code>（uv 是 0–1，左下角为原点）。可以直接用 <Code>uTime</Code>
          、<Code>uResolution</Code>、<Code>uPointer</Code>、<Code>uDark</Code>、
          <Code>uBackground</Code>，以及 <Code>themePalette(t)</Code>、<Code>snoise</Code>、
          <Code>fbm</Code>。颜色在线性空间里计算，输出时自动转换；<Code>palette</Code> 换色板，
          <Code>speed</Code> 是时间流速。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="uniforms" title="自定义 uniform 与指针" demo={Uniforms}>
          <Code>uniforms</Code> 里的对象原样交给材质，改 <Code>value</Code>{' '}
          就实时生效；返回值的透明度让页面底色透出来。指针的位置在 <Code>uPointer.xy</Code>（-1 到
          1），<Code>uPointer.z</Code> 是指针在区域内的程度，<Code>interactive</Code> 关掉时始终为
          0。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[meshApi, auroraApi, particleApi, waveApi, api]} />
  </DocPage>
));
