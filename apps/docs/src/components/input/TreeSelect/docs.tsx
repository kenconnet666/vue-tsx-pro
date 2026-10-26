import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Link } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/TreeSelectProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Appearance from './demo/Appearance.tsx?demo';
import Basic from './demo/Basic.tsx?demo';
import Remote from './demo/Remote.tsx?demo';
import Strategy from './demo/Strategy.tsx?demo';

export const meta = {
  title: 'TreeSelect 树形选择',
  description:
    '触发框同 Select，弹出的是一棵树：组织机构、产品结构、物料分类。单选一个节点，或勾选多个（父子联动），可以搜索。',
  order: 6,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { TreeSelect } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Example id="basic" title="组织机构" demo={Basic}>
      数据与 <Link href="/components/tree">Tree</Link> 相同：<Code>getKey</Code>、
      <Code>getLabel</Code>、<Code>getChildren</Code>（懒加载用 <Code>hasChildren</Code> 与{' '}
      <Code>loadChildren</Code>）。单选时点节点或 Enter 选中并关闭；
      <Code>selectionMode="multiple"</Code> 勾选，勾上父节点会勾上它的子孙，value
      默认是勾上的全部节点，触发框里只列最上层的整枝。<Code>searchable</Code>{' '}
      按节点文字过滤，命中节点的上级一起显示并展开；打开时已选节点的上级自动展开。
    </Example>
    <Example id="strategy" title="勾选的取法与标签" demo={Strategy}>
      <Code>checkedStrategy</Code> 决定多选的 value 放哪些勾上的节点（同 Ant Design 的
      showCheckedStrategy）：<Code>all</Code> 全部；<Code>parent</Code>{' '}
      整枝勾上时只放父节点（提交“整个中心”）；<Code>child</Code>{' '}
      只放叶子（提交“具体的团队”）。标签同 <Link href="/components/select">Select</Link>
      的多选：排在触发按钮前面，点 × 取消整枝，<Code>maxTagCount</Code> 按数量或宽度收起，Backspace
      移除最后一个。
    </Example>
    <Example id="appearance" title="外观与状态" demo={Appearance}>
      <Code>isDisabled</Code>{' '}
      让某些节点不能选（这里只能选到团队，中心、部这一级只用来展开）。图标、外观、尺寸、必填、只读、不可用同{' '}
      <Link href="/components/select">Select</Link>。
    </Example>
    <Example id="remote" title="远程搜索" demo={Remote}>
      数据多（整个集团的组织机构）时给 <Code>load</Code>：打开时与输入停下 300 ms
      后按搜索词请求，只采用最后一次；服务端返回命中的节点连同它们的上级，结果全部展开。
      <Code>items</Code>{' '}
      是第一次结果回来之前的树，编辑页放上已选节点的那一枝，触发框一开始就有文字；结果换掉之后也仍按见过的文字显示。
    </Example>
    <KeyboardReference
      keys={[
        ['↓ / Enter / Space', '关闭时：打开，焦点进到树里（可搜索时进到搜索框）'],
        ['↓（搜索框里）', '从搜索框进到树里'],
        ['↑ / ↓ / ← / →', '树里：移动、收起、展开（同 Tree）'],
        ['Enter', '单选：选中并关闭'],
        ['Space', '多选：勾选或取消（父子联动）'],
        ['Esc', '关闭并把焦点还给触发按钮'],
        ['Backspace', '多选（触发按钮上）：移除最后一个标签'],
      ]}
    >
      触发按钮是 role="combobox"、aria-haspopup="tree"；弹出的树同 Tree 的键盘与读屏。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
