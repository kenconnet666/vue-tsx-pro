import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import api from 'virtual:api/SortableProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Columns from './demo/Columns.tsx?demo';
import Tasks from './demo/Tasks.tsx?demo';

export const meta = {
  title: 'Sortable 拖动排序',
  description:
    '拖动把手或用键盘改变顺序，数据双向绑定：竖排、横排，拖到边缘自动滚动，换位有动画，读屏播报位置。',
  order: 10,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Sortable } from '@vue-tsx-pro/ui';">
    <Examples>
      <Example id="tasks" title="待办排序" demo={Tasks}>
        <Code>items={'{_bind(list)}'}</Code> 双向绑定，拖完直接得到新顺序。键盘：Tab 到把手，
        <Kbd>Space</Kbd> 拿起，<Kbd>↑</Kbd> <Kbd>↓</Kbd> 移动，<Kbd>Space</Kbd> 放下，<Kbd>Esc</Kbd>{' '}
        取消；读屏用 <Code>getLabel</Code> 的文字播报“移到第几位”。
      </Example>
      <Example id="columns" title="横排：调整列顺序" demo={Columns}>
        <Code>orientation="horizontal"</Code> 横排，键盘用 <Kbd>←</Kbd> <Kbd>→</Kbd>
        。项多时在外面包 ScrollArea，拖到边缘会自动滚动。
      </Example>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
