import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import aspectRatioApi from 'virtual:api/AspectRatioProps';
import embedApi from 'virtual:api/EmbedProps';
import api from 'virtual:api/FigureProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Captions from './demo/Captions.tsx?demo';
import Embedded from './demo/Embedded.tsx?demo';
import Ratio from './demo/Ratio.tsx?demo';

export const meta = {
  title: 'Figure 插图与嵌入',
  description:
    '带说明的插图（figure）、固定宽高比的框（AspectRatio）、嵌入的页面（Embed，iframe）：说明是内容的名称，比例框加载前就占好位置。',
  order: 8.5,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Figure, AspectRatio, Embed } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="captions" title="图片与表格的说明" demo={Captions}>
          <Code>Figure</Code> 是 figure 元素，<Code>caption</Code> 是
          figcaption：读屏把说明当作这块内容的名称。图片、图表的说明在下面；表格的说明习惯放上面（
          <Code>captionSide="top"</Code>）。<Code>align</Code> 让内容与说明一起对齐。
        </Example>
        <Example id="embed" title="嵌入的页面" demo={Embedded}>
          <Code>Embed</Code> 是带外框的 iframe：<Code>title</Code>{' '}
          必填（读屏靠它知道这一块是什么），默认延迟加载（滚到附近才加载）、
          <Code>referrerpolicy</Code> 是
          strict-origin-when-cross-origin，加载完之前显示骨架。嵌入不受信任的页面时写{' '}
          <Code>sandbox</Code>，只放开需要的权限；<Code>allow</Code>、<Code>srcdoc</Code>{' '}
          这些原生属性照常落到 iframe 上。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="ratio" title="固定宽高比" demo={Ratio}>
          <Code>AspectRatio</Code> 的宽度跟着容器，高度按比例算，里面的元素铺满它（图片、视频按
          cover 裁切）。封面、地图、播放器在加载前就占好位置，加载完不把下面的内容顶开。
          <Code>ratio</Code> 接受数（<Code>{'{16 / 9}'}</Code>）或 CSS 的写法（
          <Code>"4 / 3"</Code>）。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, aspectRatioApi, embedApi]} />
  </DocPage>
));
