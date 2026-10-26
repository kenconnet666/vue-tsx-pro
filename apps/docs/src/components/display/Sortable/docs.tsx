import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Kbd } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/SortableProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Columns from './demo/Columns.tsx?demo';
import Tasks from './demo/Tasks.tsx?demo';

export const meta = {
  title: 'Sortable 拖动排序',
  description:
    '拖动把手或用键盘改变顺序，数据双向绑定：竖排、横排，拖到边缘自动滚动，换位有动画，读屏播报位置。',
  order: 10,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Sortable } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="tasks" title="待办排序" demo={Tasks}>
          <Code>_items={'{list}'}</Code> 双向绑定，拖完直接得到新顺序。键盘：Tab 到把手，
          <Kbd>Space</Kbd> 拿起，<Kbd>↑</Kbd> <Kbd>↓</Kbd> 移动，<Kbd>Space</Kbd> 放下，
          <Kbd>Esc</Kbd> 取消；读屏用 <Code>getLabel</Code> 的文字播报“移到第几位”。
          <Code>disabled</Code> 时把手不可用，列表照常显示。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="columns" title="横排：调整列顺序" demo={Columns}>
          <Code>orientation="horizontal"</Code> 横排，键盘用 <Kbd>←</Kbd> <Kbd>→</Kbd>
          。项多时在外面包 ScrollArea，拖到边缘会自动滚动。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['Space / Enter', '在把手上：拿起这一项；拿起后再按：放下'],
        ['↓ / ↑', '拿起后：移动一位（横排时用 → / ←，跟随从右到左排版）'],
        ['Home / End', '拿起后：移到最前 / 最后'],
        ['Esc', '取消，回到原来的位置'],
      ]}
    >
      拿起、移动、放下、取消都会播报给读屏（WCAG 2.5.7 的拖动替代操作）。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
