import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/CarouselProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Drawings from './demo/Drawings.tsx?demo';
import Products from './demo/Products.tsx?demo';
import Thumbnails from './demo/Thumbnails.tsx?demo';

export const meta = {
  title: 'Carousel 轮播',
  description:
    '横幅、商品图、图片组：原生横向滚动加吸附，上一张 / 下一张、页点，自动播放可以暂停，一次可以看几张。',
  order: 9,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Carousel } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="autoplay" title="自动播放" demo={Drawings}>
          <Code>items</Code> 加渲染函数，每一张是 role="group"、名称“第 2 张，共 6
          张”。滚动是浏览器自己的（scroll-snap）：手指滑、触摸板拖都行，停下时吸附到整张。
          <Code>autoplay</Code>
          {
            ' 为 true 是每 5 秒换一张（数字是毫秒）；指针停在上面、焦点进到里面时暂停，底部有暂停 / 播放按钮；偏好减少动态效果时一开始就是暂停的。不自动播放时滚动区域是 aria-live="polite"，换张会念。'
          }
        </Example>
        <Example id="thumbnails" title="图片组与缩略图" demo={Thumbnails}>
          <Code>_index</Code>
          {' 是最前面那张的序号，滚动、按钮、页点都会写回；父级改它就滚过去。'}
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="per-view" title="一次看几张" demo={Products}>
          <Code>slidesPerView</Code> 是一次看几张（可以是 1.5，露出下一张的一半提示能滑），
          <Code>gap</Code> 是间距。<Code>loop={'{false}'}</Code>{' '}
          {'时到头那一侧的按钮不可用（默认循环）；'}
          <Code>arrows</Code>、<Code>dots</Code> 去掉两侧按钮或页点。从右到左排版时方向跟着换。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        [
          'Tab',
          '暂停 / 播放按钮、上一张 / 下一张、各个页点依次在 Tab 顺序里；焦点进来时自动播放暂停',
        ],
        ['Enter / Space', '在按钮、页点上：换到那一张'],
        ['Shift + 滚轮 / 触摸板', '横向滚动，停下时吸附到整张'],
      ]}
    />
    <ApiReference api={api} />
  </DocPage>
));
