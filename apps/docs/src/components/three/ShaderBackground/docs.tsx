import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ShaderBackgroundProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Basic from './demo/Basic.tsx?demo';
import Content from './demo/Content.tsx?demo';
import Performance from './demo/Performance.tsx?demo';
import Uniforms from './demo/Uniforms.tsx?demo';

export const meta = {
  title: 'ShaderBackground 着色器背景',
  description:
    '写一个片段着色器函数，主题色、时间、尺寸、指针自动作为 uniform 传入；MeshGradient、AuroraBackground 都建在它上面。需要安装 three。',
  order: 5,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ShaderBackground } from '@zerodep-dev/vue-tsx-pro-ui/three';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="基础用法" demo={Basic}>
          <Code>fragmentShader</Code> 只写 <Code>vec4 shade(vec2 uv)</Code>（uv 是
          0–1，左下角为原点）。可以直接用 <Code>uTime</Code>、<Code>uResolution</Code>、
          <Code>uPointer</Code>、<Code>uDark</Code>、<Code>uBackground</Code>，以及{' '}
          <Code>themePalette(t)</Code>、<Code>snoise</Code>、<Code>fbm</Code>
          。颜色在线性空间里计算，输出时自动转换。
        </Example>
        <Example id="content" title="叠加内容、色板与流速" demo={Content}>
          子元素叠在画布上面，照常排版、可以交互；外层要给高度或让内容撑开，
          <Code>propsContent</Code> 给内容外层加样式。<Code>palette</Code> 换色板（token 或 CSS
          颜色，最多 6 个），<Code>speed</Code> 是时间流速，
          <Code>interactive</Code> 关掉时 <Code>uPointer.z</Code> 始终为 0。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="uniforms" title="自定义 uniform 与指针" demo={Uniforms}>
          <Code>uniforms</Code> 里的对象原样交给材质，改 <Code>value</Code>{' '}
          就实时生效；返回值的透明度让页面底色透出来。指针的位置在 <Code>uPointer.xy</Code>（-1 到
          1），<Code>uPointer.z</Code> 是指针在区域内的程度。
        </Example>
        <Example id="performance" title="画质、分辨率与降级" demo={Performance}>
          所有 3D 效果共有：<Code>quality</Code> 是画质档位，<Code>off</Code> 不创建 WebGL、直接显示{' '}
          <Code>fallback</Code>（没有 WebGL 时也显示它，默认是主题色的柔和渐变）；
          <Code>resolution</Code> 按比例降低渲染分辨率，平滑的渐变降到一半几乎看不出差别；
          <Code>paused</Code> 停在当前画面。滚出视口、切到别的标签页时自动停下。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
