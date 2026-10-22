import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ChecklistProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Layouts from './demo/Layouts.tsx?demo';

export const meta = {
  title: 'Checklist 完成清单',
  description: '每一项完成了没有，带补充信息：里程碑、关闭材料、上线检查、引导任务。',
  order: 14,
};

export default _component(() => () => (
  <DocPage meta={meta} imports="import { Checklist } from '@vue-tsx-pro/ui';">
    <Example id="layouts" title="三种排法" demo={Layouts}>
      <Code>items</Code> 的每一项是 <Code>label</Code>、<Code>done</Code> 与可选的{' '}
      <Code>extra</Code>（日期、证据、超时）；没完成的名称是次要色。<Code>layout="list"</Code>{' '}
      一项一行（卡片里），<Code>inline</Code> 一行排开、放不下换行（表格的详情行），
      <Code>icons</Code> 只有一排图标（表格的格子里），悬停与读屏有每一项完成没有。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
