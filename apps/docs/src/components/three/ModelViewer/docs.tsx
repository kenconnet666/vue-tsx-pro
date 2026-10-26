import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Kbd } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ModelViewerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Objects from './demo/Objects.tsx?demo';
import Angles from './demo/Angles.tsx?demo';
import Product from './demo/Product.tsx?demo';

export const meta = {
  title: 'ModelViewer 模型查看器',
  description:
    '加载 glTF / GLB 或程序生成的对象，自动居中缩放，拖动环绕查看、缓缓自转，摄影棚式的环境光。需要安装 three。',
  order: 8,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ModelViewer } from '@zerodep-dev/vue-tsx-pro-ui/three';"
  >
    <Example id="product" title="商品详情" demo={Product}>
      <Code>src</Code> 是 glTF / GLB
      的地址，模型按外接球居中、缩放到占满画面。拖动环绕（松手带惯性），获得焦点后
      <Kbd>←</Kbd> <Kbd>→</Kbd> <Kbd>↑</Kbd> <Kbd>↓</Kbd> 也能转；<Code>zoom</Code> 打开滚轮与{' '}
      <Kbd>+</Kbd> / <Kbd>-</Kbd> 缩放。写了 <Code>alt</Code> 时整块是带名称的图像；加载完成调用{' '}
      <Code>onLoad</Code>。
    </Example>
    <Example id="objects" title="程序生成的对象与出错" demo={Objects}>
      <Code>object</Code> 直接给 three 的对象。光照是 RoomEnvironment
      的环境光，金属、清漆、透光的材质都能正确地反光，
      <Code>exposure</Code> 调整体亮度；加载失败时显示语言包里的提示，<Code>onError</Code>{' '}
      拿到原因。
    </Example>
    <Example id="angles" title="多角度展示" demo={Angles}>
      <Code>orbit</Code> 是一开始的角度（<Code>yaw</Code> 绕竖轴、<Code>pitch</Code>{' '}
      从上往下看为正，单位度）；<Code>controls={'{false}'}</Code>{' '}
      关掉拖动与方向键，整块不可聚焦。缩略图用 <Code>quality="low"</Code> 与较低的{' '}
      <Code>resolution</Code>；<Code>paused</Code> 停住自转，没有 WebGL 时显示 <Code>fallback</Code>
      。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
