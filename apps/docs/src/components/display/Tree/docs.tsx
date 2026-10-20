import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/TreeProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Checkable from './demo/Checkable.tsx?demo';
import Files from './demo/Files.tsx?demo';

export const meta = {
  title: 'Tree 树',
  description:
    '可展开的层级列表（文件夹、组织架构、分类）：单选、多选、父子联动的勾选、懒加载子节点，始终虚拟滚动。',
  order: 7,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Tree } from '@vue-tsx-pro/ui';">
    <Examples>
      <Example id="files" title="文件树" demo={Files}>
        <Code>getKey</Code>、<Code>getLabel</Code>、<Code>getChildren</Code>{' '}
        读你自己的数据结构，不用先转换；<Code>getIcon</Code> 按展开状态换图标。键盘 ↑↓ 移动，→
        展开，← 收起，Enter 选中，输入文字跳到匹配项。
      </Example>
      <Example id="checkable" title="勾选" demo={Checkable}>
        <Code>checkable</Code>{' '}
        时每项前有勾选框：勾上父节点会勾上全部子孙，子节点全勾上时父节点也勾上，只勾一部分时父节点半选（读屏念“部分选中”）。
        <Code>checked</Code> 里是全部勾上的节点。
      </Example>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
