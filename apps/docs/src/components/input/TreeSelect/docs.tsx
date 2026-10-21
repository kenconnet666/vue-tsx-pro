import { _component } from '@vue-tsx-pro/tsx';
import { Code, Link } from '@vue-tsx-pro/ui';
import api from 'virtual:api/TreeSelectProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Appearance from './demo/Appearance.tsx?demo';
import Basic from './demo/Basic.tsx?demo';

export const meta = {
  title: 'TreeSelect 树形选择',
  description:
    '触发框同 Select，弹出的是一棵树：组织机构、产品结构、物料分类。单选一个节点，或勾选多个（父子联动），可以搜索。',
  order: 5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { TreeSelect } from '@vue-tsx-pro/ui';">
    <Example id="basic" title="组织机构" demo={Basic}>
      数据与 <Link href="/components/tree">Tree</Link> 相同：<Code>getKey</Code>、
      <Code>getLabel</Code>、<Code>getChildren</Code>（懒加载用 <Code>hasChildren</Code> 与{' '}
      <Code>loadChildren</Code>）。单选时点节点或 Enter 选中并关闭；
      <Code>selectionMode="multiple"</Code> 勾选，勾上父节点会勾上它的子孙，value
      是勾上的全部节点，触发框里只列最上层的整枝。<Code>searchable</Code>{' '}
      按节点文字过滤，命中节点的上级一起显示并展开；打开时已选节点的上级自动展开。
    </Example>
    <Example id="appearance" title="外观与状态" demo={Appearance}>
      <Code>isDisabled</Code>{' '}
      让某些节点不能选（这里只能选到团队，中心、部这一级只用来展开）。图标、外观、尺寸、必填、只读、不可用同{' '}
      <Link href="/components/select">Select</Link>。
    </Example>
    <KeyboardReference
      keys={[
        ['↓ / Enter / Space', '关闭时：打开，焦点进到树里（可搜索时进到搜索框）'],
        ['↓（搜索框里）', '从搜索框进到树里'],
        ['↑ / ↓ / ← / →', '树里：移动、收起、展开（同 Tree）'],
        ['Enter', '单选：选中并关闭'],
        ['Space', '多选：勾选或取消（父子联动）'],
        ['Esc', '关闭并把焦点还给触发按钮'],
      ]}
    >
      触发按钮是 role="combobox"、aria-haspopup="tree"；弹出的树同 Tree 的键盘与读屏。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
