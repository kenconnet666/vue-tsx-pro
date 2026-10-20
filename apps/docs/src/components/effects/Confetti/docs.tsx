import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ConfettiProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Celebrate from './demo/Celebrate.tsx?demo';
import Controls from './demo/Controls.tsx?demo';

export const meta = {
  title: 'Confetti 彩纸',
  description:
    '庆祝的彩纸：trigger 变一次放一批，翻转着飘落；只在飘的时候占用画布，颜色跟随主题。需要安装 three。',
  order: 6,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Confetti } from '@vue-tsx-pro/ui/three';">
    <Example id="celebrate" title="庆祝" demo={Celebrate}>
      <Code>trigger</Code>{' '}
      每变一次放一批（写成计数就行），挂载时的初始值不放。默认铺满视口、放在顶层，盖得住打开着的对话框，指针穿透；
      <Code>origin</Code> 是相对视口的比例，可以从点的按钮处喷出。同一个 trigger 给几个
      Confetti，就能从不同的位置一起放。减少动态效果时不放。
    </Example>
    <Example id="controls" title="在一块区域里放" demo={Controls}>
      <Code>fullscreen={'{false}'}</Code> 时铺满最近的定位父元素。<Code>angle</Code>{' '}
      是喷出的方向（90 是正上方），<Code>spread</Code>{' '}
      是散开的角度；初速度按区域大小算，小区域里不会冲出去。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
