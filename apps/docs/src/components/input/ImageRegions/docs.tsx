import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ImageRegionsProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import SpriteSheet from './demo/SpriteSheet.tsx?demo';

export const meta = {
  title: 'ImageRegions 图上的区域',
  description:
    '一张图片上的若干矩形框：选中、拖动、拖把手改大小、拖锚点，视口能平移缩放。精灵表切图、图片标注、热区、贴图图集都用它。',
  order: 21,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ImageRegions, createImageRegionsController } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Examples>
      <Example id="sprite-sheet" title="精灵表切图" demo={SpriteSheet}>
        框按图片的像素记（<Code>x</Code>、<Code>y</Code>、<Code>width</Code>、<Code>height</Code>
        ），改动按 <Code>snap</Code> 取整（默认整像素）；<Code>anchors</Code>{' '}
        时画出各框的锚点、能拖，
        <Code>pixelated</Code> 让像素画放大后不糊。改动经 <Code>onRegionChange</Code>{' '}
        交出去，拖动中是 <Code>phase: 'move'</Code>、松开是 <Code>'end'</Code>（撤销、存盘在 end
        时做）。
        <Code>createImageRegionsController</Code> 建的控制器让工具条的按钮能整张放进视口、缩放。
      </Example>
    </Examples>
    <KeyboardReference
      keys={[
        ['方向键', '挪选中的框；没有选中的框时平移'],
        ['Shift + 方向键', '一次挪十格'],
        ['Alt + 方向键', '改选中的框的宽高'],
        ['+ / − / 0', '放大、缩小、回到初始'],
      ]}
    >
      点框选中，拖框挪位置，拖选中框的边、角改大小；拖空白处平移，滚轮以指针为中心缩放。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
