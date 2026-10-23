import { _component } from '@vue-tsx-pro/tsx';
import { Code, Link } from '@vue-tsx-pro/ui';
import api from 'virtual:api/TransferBaseProps';
import treeApi from 'virtual:api/TreeTransferProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Departments from './demo/Departments.tsx?demo';
import Members from './demo/Members.tsx?demo';

export const meta = {
  title: 'Transfer 穿梭框',
  description:
    '左边可选、右边已选，勾上之后移过去：分配权限、指派成员、挑选导出的列。左边也可以是一棵树。',
  order: 16,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Transfer, TreeTransfer } from '@vue-tsx-pro/ui';">
    <Example id="members" title="项目成员" demo={Members}>
      每一边是一个可多选的 <Link href="/components/listbox">Listbox</Link>
      （虚拟滚动，上千项也不卡）：上方是全选框、标题与“勾上 / 总数”，<Code>searchable</Code>{' '}
      时带搜索框，全选只管搜索后留下的项。<Code>value</Code> 是右边的值，按移过去的先后排列；选项的{' '}
      <Code>disabled</Code>{' '}
      勾不上也就移不动。移动后读屏播报移了几项。窄屏时两边上下排，按钮换成上下箭头。
    </Example>
    <Example id="tree" title="左边是一棵树" demo={Departments}>
      <Code>TreeTransfer</Code> 的左边是勾选的 <Link href="/components/tree">Tree</Link>
      （父子联动，勾上部门就是它下面的全部团队），只移叶子；已经移过去的叶子在树上勾上且不可用。
    </Example>
    <KeyboardReference
      keys={[
        ['Tab', '在全选框、搜索框、列表、按钮之间移动'],
        ['↑ / ↓ / Home / End', '列表里移动高亮（同 Listbox、Tree）'],
        ['Space', '勾上或取消高亮的项'],
        ['Enter', '点中间的按钮：把勾上的项移到另一边'],
      ]}
    >
      整个穿梭框是一组（role="group"，名称是 Field
      的标签），两边的列表各以自己的标题为名，按钮的名称是“移到某一边”。
    </KeyboardReference>
    <ApiReference api={[api, treeApi]} />
  </DocPage>
));
