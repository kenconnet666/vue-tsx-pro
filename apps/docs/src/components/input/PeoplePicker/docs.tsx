import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/PeoplePickerProps';
import panelApi from 'virtual:api/PeoplePickerPanelProps';
import sourceApi from 'virtual:api/PeopleSource';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import FieldDemo from './demo/Field.tsx?demo';
import Panel from './demo/Panel.tsx?demo';
import Remote from './demo/Remote.tsx?demo';

export const meta = {
  title: 'PeoplePicker 人员与组织选择器',
  description:
    '选人员、部门、岗位：按组织架构一层层找、搜索、看最近选过的，右边是已选的。数据由接入方的 source 提供，表单字段或直接放面板。',
  order: 18,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { localPeopleSource, PeoplePicker, PeoplePickerPanel, type PeopleEntry, type PeopleSource } from '@vue-tsx-pro/ui';"
  >
    <Example id="field" title="表单字段" demo={FieldDemo}>
      <Code>PeoplePicker</Code> 的触发框里是已选的标签，点开对话框挑选，按“确定”才写回。
      <Code>types</Code> 决定能选哪几种，<Code>max={'{1}'}</Code> 只选一个；
      <Code>recentKey</Code> 把勾过的记在浏览器里（“最近”页）。值是 <Code>PeopleEntry</Code>{' '}
      的数组，带着名字，回显不用再查。
    </Example>
    <Example id="panel" title="直接放面板" demo={Panel}>
      <Code>PeoplePickerPanel</Code> 可以直接放在页面、抽屉里，改动立即写回。
      <Code>source.positions</Code> 给了时有“岗位”页；<Code>max</Code> 勾满之后其余的勾选框不可用。
    </Example>
    <Example id="remote" title="远程数据" demo={Remote}>
      <Code>source</Code> 的 <Code>children</Code>、<Code>search</Code>、<Code>positions</Code>{' '}
      按自己的接口实现，<Code>signal</Code> 在换了部门、改了搜索词时中止。
      {'搜索在输入停下 300 ms 后进行，只采用最后一次。'}
      整棵组织架构已经在前端时用 <Code>localPeopleSource</Code>。
    </Example>
    <KeyboardReference
      keys={[
        ['Enter / Space / ↓', '触发按钮上：打开对话框'],
        ['Backspace', '触发按钮上：移除最后一个'],
        [
          'Tab',
          '对话框里依次经过搜索框、浏览方式、面包屑、全选、每行的勾选框与“下级”、已选的移除按钮',
        ],
        ['Space', '勾上或取消一行'],
      ]}
    >
      {'每行的勾选框以名字为名，“下级”按钮的名称是“下级：某部门”，进去后焦点落到列表上。'}
      {'面包屑的当前一级标 aria-current="location"。'}
    </KeyboardReference>
    <ApiReference api={[api, panelApi, sourceApi]} />
  </DocPage>
));
