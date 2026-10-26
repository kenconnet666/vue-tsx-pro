import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ChecklistProps';
import itemApi from 'virtual:api/ChecklistItem';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Closing from './demo/Closing.tsx?demo';
import Compact from './demo/Compact.tsx?demo';
import Launch from './demo/Launch.tsx?demo';

export const meta = {
  title: 'Checklist 完成清单',
  description:
    '一组要做完的事：每项的状态（完成、待办、超时、受阻、不适用）与上下文——说明、负责人、日期、证据、操作，带完成进度；可以勾选。',
  order: 13.5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Checklist } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Example id="closing" title="里程碑与结项材料" demo={Closing}>
      每项的 <Code>status</Code> 决定图标与颜色：<Code>done</Code> 完成、<Code>todo</Code>{' '}
      待办（默认）、<Code>overdue</Code> 超时（日期标红）、<Code>blocked</Code> 受阻、
      <Code>skipped</Code> 不适用（划掉，不算进进度）。名称下面是 <Code>description</Code> 与一行{' '}
      <Code>owner</Code> · <Code>date</Code> · <Code>evidence</Code>，<Code>action</Code>{' '}
      在结束边（催办、上传）。<Code>summary</Code> 显示完成数与进度条。状态写在给读屏的文字里。
    </Example>
    <Examples>
      <ExampleColumn>
        <Example id="launch" title="可以勾选：上线检查" demo={Launch}>
          给了 <Code>onCheckedChange</Code> 时状态图标是复选按钮（<Code>role="checkbox"</Code>
          ，名称是这一项），点了报告新的完成状态，状态由使用方保存；不适用、受阻的不能勾。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="compact" title="表格里与一行排开" demo={Compact}>
          <Code>layout="icons"</Code> 只有一排状态图标，放在表格的格子里，悬停与读屏有每一项的说明；
          <Code>layout="inline"</Code> 一行排开、放不下换行，显示名称、日期与证据。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, itemApi]} />
  </DocPage>
));
