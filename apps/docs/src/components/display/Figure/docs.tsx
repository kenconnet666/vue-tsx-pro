import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import aspectRatioApi from 'virtual:api/AspectRatioProps';
import embedApi from 'virtual:api/EmbedProps';
import api from 'virtual:api/FigureProps';
import videoApi from 'virtual:api/VideoProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Captions from './demo/Captions.tsx?demo';
import Clip from './demo/Clip.tsx?demo';
import Embedded from './demo/Embedded.tsx?demo';
import Player from './demo/Player.tsx?demo';
import Ratio from './demo/Ratio.tsx?demo';

export const meta = {
  title: 'Figure 插图、视频与嵌入',
  description:
    '带说明的插图（figure）、固定宽高比的框（AspectRatio）、视频（Video）、嵌入的页面（Embed，iframe）：说明是内容的名称，比例框加载前就占好位置。',
  order: 8.5,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Figure, AspectRatio, Video, Embed } from '@zerodep-dev/vue-tsx-pro-ui';"
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
        <Example id="video" title="视频" demo={Clip}>
          <Code>Video</Code> 用浏览器自己的控制条，外面是定比例的框（<Code>ratio</Code>
          ），画面完整放进去、四周黑底；<Code>poster</Code> 是封面，<Code>sources</Code>{' '}
          给几种格式，<Code>tracks</Code> 是字幕。<Code>autoplay</Code>{' '}
          默认静音、行内播放，系统要求减少动态效果时不自动播放并显示控制条。要倍速、跟主题走的控制条见下一个示例。
        </Example>
        <Example id="player" title="自绘的控制条" demo={Player}>
          <Code>controls="custom"</Code> 换成跟主题走的控制条：播放 /
          暂停、时间与进度、静音与音量、字幕（有 <Code>tracks</Code> 时）、倍速（<Code>speeds</Code>
          ）、全屏。播放中鼠标离开画面、或几秒不动就收起，暂停、移动鼠标、键盘聚焦、菜单开着时留着；点画面切换播放。各家浏览器的原生控制条长得不一样，要统一外观时用它；只要能播，默认的原生控制条更稳。
        </Example>
        <Example id="ratio" title="固定宽高比" demo={Ratio}>
          <Code>AspectRatio</Code> 的宽度跟着容器，高度按比例算，里面的元素铺满它（图片、视频按
          cover 裁切）。封面、地图、播放器在加载前就占好位置，加载完不把下面的内容顶开。
          <Code>ratio</Code> 接受数（<Code>{'{16 / 9}'}</Code>）或 CSS 的写法（
          <Code>"4 / 3"</Code>）。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['Space / K', '自绘控制条的视频：播放、暂停'],
        ['← / →', '快退、快进 5 秒（焦点在进度滑块上时按滑块的步长）'],
        ['↑ / ↓', '音量加、减'],
        ['M', '静音、取消静音'],
        ['F', '全屏、退出全屏'],
      ]}
    >
      焦点在播放器里（画面或任何一个按钮上）时生效；控制条里的按钮、滑块、菜单都能用 Tab 走到。
    </KeyboardReference>
    <ApiReference api={[api, aspectRatioApi, videoApi, embedApi]} />
  </DocPage>
));
