import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/FilterBarProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Tasks from './demo/Tasks.tsx?demo';

export const meta = {
  title: 'FilterBar 查询栏',
  description:
    '列表页上方的筛选条件：自动排成栅格，查询与重置在栅格的结束边，不常用的条件收起，在输入框里回车就是查询。',
  order: 2,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { FilterBar } from '@vue-tsx-pro/ui';">
    <Example id="tasks" title="降本任务的查询" demo={Tasks}>
      条件是 Field，排成栅格：每格不窄于 <Code>minFieldWidth</Code>（默认
      16em），栅格多宽就放几格。按钮区在栅格的结束边，宽度随按钮、不折行，和条件的最后一行对齐；
      <Code>actions</Code>{' '}
      里再加按钮也不会挤成两行，容器放不下时按钮区整体换到下一行。标签默认在起始边、宽度随文字（
      <Code>labelWidth</Code> 默认 auto，控件紧跟着标签；条件多、要几行对齐时写固定宽度）。
      <Code>more</Code> 是不常用的条件，默认收起；<Code>moreActive</Code>{' '}
      是收起的条件里已经填了几项，显示在“展开”旁边，免得忘了还有条件生效。外层是{' '}
      <Code>role="search"</Code> 的表单：在输入框里按回车就是 <Code>onSearch</Code>，
      <Code>loading</Code> 时“查询”显示加载中。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
