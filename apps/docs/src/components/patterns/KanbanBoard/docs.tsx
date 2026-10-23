import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/KanbanBoardProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Confirm from './demo/Confirm.tsx?demo';
import Flow from './demo/Flow.tsx?demo';

export const meta = {
  title: 'KanbanBoard 看板',
  description:
    '卡片按状态分列，拖到别的列表示推进：能不能放由使用方判断并写明原因，放下后由使用方改数据；键盘、读屏都能操作。',
  order: 7,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { KanbanBoard } from '@vue-tsx-pro/ui/patterns';">
    <Examples>
      <ExampleColumn wide>
        <Example id="flow" title="只能挪到相邻的列" demo={Flow}>
          看板不自己挪卡片：放下时报告 <Code>onMove</Code>，使用方改了数据卡片才换列。
          <Code>canMove</Code>{' '}
          返回不能放的原因：拖动经过时那一列标红并写出原因，放下时卡片弹回、报告{' '}
          <Code>onReject</Code>。列名旁的计数用 <Code>tone</Code> 提示要注意的列。各列至少{' '}
          <Code>columnWidth</Code> 宽，放得下时平分整行，放不下时横向滚动；<Code>columnHeight</Code>{' '}
          是列的最大高度，卡片多时列里滚动。
        </Example>
      </ExampleColumn>
      <ExampleColumn wide>
        <Example id="confirm" title="放下后先确认" demo={Confirm}>
          要填意见、要审批的移动：<Code>onMove</Code> 里打开对话框（这里是{' '}
          <Code>useFormDialog</Code>
          ，也可以是抽屉），确认后再改数据，取消就什么都不变。卡片的渲染函数拿到{' '}
          <Code>dragging</Code>，拖动中可以换一种写法；空列显示 <Code>empty</Code>。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['Space / Enter', '在卡片的把手上：拿起；拿起后再按：放到当前所在的列'],
        ['← / →', '拿起后：换到左边 / 右边一列（跟随从右到左排版），播报那一列能不能放'],
        ['Esc', '取消，卡片留在原来的列'],
      ]}
    >
      鼠标、触屏在卡片上按下拖动；卡片里的链接、按钮照常点。拿起、换列、放下、取消都会播报给读屏（WCAG
      2.5.7 的拖动替代操作）。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
