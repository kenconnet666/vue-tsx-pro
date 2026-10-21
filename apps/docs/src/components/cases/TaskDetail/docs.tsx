import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import stepsApi from 'virtual:api/StepsProps';
import timelineApi from 'virtual:api/TimelineProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import TaskDetail from './frames/TaskDetail.tsx?demo';

export const meta = {
  title: 'Task Detail 项目详情',
  description:
    '任务卡：按当前状态给出下一步，八个状态的步骤条，概览、降本明细或实施节点、变更记录，右栏是收益（A、B、D）、里程碑与关闭三材料。',
  order: 5,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Card, Descriptions, Steps, Table, Timeline } from '@vue-tsx-pro/ui';"
  >
    <Example id="detail" title="项目详情" demo={TaskDetail} frame="48rem">
      页头写编码、名称、状态与收益状态，主按钮按当前状态给出下一步（启动方案设计、提交验证、认定收益锁定
      A、回填
      B、关闭归档……），点了真的推进并写回任务卡，台账与看板随之变化；“更多”里是调整计划、暂停、终止（要确认）与删除（只限待启动）。
      <Code>Steps</Code>{' '}
      是八个正常状态，暂停、终止、挂账待定按完成了几个里程碑推断停在哪一步并标红。左栏是概览（主表字段，与编辑页同组）、单机的降本明细（零件更改与单机零件收益）或
      DMC 的实施节点（超时标红），最后是 <Code>Timeline</Code>{' '}
      的变更记录；右栏粘在顶栏下面：收益（预期、测算 A、商务 B，差额 D
      与归因、金额口径）、里程碑与交付证据、关闭三材料。地址上带 <Code>code</Code>
      ，台账的编码都链到这里。
    </Example>
    <ApiReference api={[stepsApi, timelineApi]} />
  </DocPage>
));
