import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ShaderBackgroundProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Basic from './demo/Basic.tsx?demo';
import Uniforms from './demo/Uniforms.tsx?demo';

export const meta = {
  title: 'ShaderBackground 着色器背景',
  description:
    '写一个片段着色器函数，主题色、时间、尺寸、指针自动作为 uniform 传入；MeshGradient、AuroraBackground 都建在它上面。需要安装 three。',
  order: 5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { ShaderBackground } from '@vue-tsx-pro/ui/three';">
    <Examples>
      <Example id="basic" title="基础用法" demo={Basic}>
        <Code>fragmentShader</Code> 只写 <Code>vec4 shade(vec2 uv)</Code>（uv 是
        0–1，左下角为原点）。可以直接用 <Code>uTime</Code>、<Code>uResolution</Code>、
        <Code>uPointer</Code>、<Code>uDark</Code>、<Code>uBackground</Code>，以及{' '}
        <Code>themePalette(t)</Code>、<Code>snoise</Code>、<Code>fbm</Code>
        。颜色在线性空间里计算，输出时自动转换。
      </Example>
      <Example id="uniforms" title="自定义 uniform 与指针" demo={Uniforms}>
        <Code>uniforms</Code> 里的对象原样交给材质，改 <Code>value</Code>{' '}
        就实时生效；返回值的透明度让页面底色透出来。指针的位置在 <Code>uPointer.xy</Code>（-1 到
        1），<Code>uPointer.z</Code> 是指针在区域内的程度。
      </Example>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
