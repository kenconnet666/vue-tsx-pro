import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/TreeProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Checkable from './demo/Checkable.tsx?demo';
import Files from './demo/Files.tsx?demo';
import Lazy from './demo/Lazy.tsx?demo';

export const meta = {
  title: 'Tree 树',
  description:
    '可展开的层级列表（文件夹、组织架构、分类）：单选、多选、父子联动的勾选、懒加载子节点，始终虚拟滚动。',
  order: 7,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Tree } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="files" title="文件树" demo={Files}>
          <Code>getKey</Code>、<Code>getLabel</Code>、<Code>getChildren</Code>{' '}
          读你自己的数据结构，不用先转换；<Code>getIcon</Code> 按展开状态换图标。键盘 ↑↓ 移动，→
          展开，← 收起，Enter 选中，输入文字跳到匹配项。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="checkable" title="勾选" demo={Checkable}>
          <Code>checkable</Code>{' '}
          时每项前有勾选框：勾上父节点会勾上全部子孙，子节点全勾上时父节点也勾上，只勾一部分时父节点半选（读屏念“部分选中”）。
          <Code>checked</Code> 里是全部勾上的节点。权限树里“只给这一级”时写{' '}
          <Code>checkStrictly</Code>：父子不联动，各自勾选。
        </Example>
        <Example id="lazy" title="按需加载、不可用与自定义内容" demo={Lazy}>
          <Code>hasChildren</Code> 说节点有子节点（还没取回来也能展开），展开时调用{' '}
          <Code>loadChildren</Code>，返回 Promise 期间显示加载指示；取回后放进数据。
          <Code>isDisabled</Code> 的节点可以经过、展开，不能选中；<Code>getIcon</Code>{' '}
          按节点（和展开状态）换图标，
          <Code>renderItem</Code> 自定义文字部分，<Code>indent</Code>{' '}
          改每层的缩进（em）。整棵树还没取回来时写 <Code>loading</Code>（骨架行），没有节点时显示{' '}
          <Code>empty</Code>（默认“暂无数据”）。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['↓ / ↑', '移到下一个 / 上一个看得见的节点'],
        ['→', '展开节点；已展开时进入第一个子节点（从右到左排版时用 ←）'],
        ['←', '收起节点；已收起或是叶子时回到父节点（从右到左排版时用 →）'],
        ['Home / End', '移到第一个 / 最后一个看得见的节点'],
        ['Enter', '选中节点；不能选中时展开或收起'],
        ['Space', '勾选（checkable 时），否则选中'],
        ['字母键', '移到下一个以它开头的节点'],
      ]}
    >
      整棵树只占一个 Tab 位置，当前项经 aria-activedescendant 告诉读屏；层级与位置经
      aria-level、aria-setsize、aria-posinset 念出。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
