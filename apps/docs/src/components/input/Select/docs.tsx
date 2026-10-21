import { _component } from '@vue-tsx-pro/tsx';
import { Code, Link } from '@vue-tsx-pro/ui';
import api from 'virtual:api/SelectBaseProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Appearance from './demo/Appearance.tsx?demo';
import Assign from './demo/Assign.tsx?demo';
import Members from './demo/Members.tsx?demo';

export const meta = {
  title: 'Select 下拉选择',
  description:
    '点开一列选项选一个或几个，同原生 select 的交互。要边输入边筛选用 Combobox，输入多个标签用 TagsInput，平铺在页面上用 Listbox。',
  order: 4,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Select } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="单选与多选" demo={Assign}>
          <Code>items</Code>{' '}
          可以是字符串、ListboxOption（值、文字、图标、说明、分组、不可用），或任意数据加{' '}
          <Code>toOption</Code>；子节点是渲染函数时自定义选项内容，拿到的是原始数据。
          <Code>selectionMode="multiple"</Code> 多选，已选的显示成标签。键盘同原生
          select：关闭时按字母直接选中以它开头的项。
        </Example>
        <Example id="appearance" title="图标、外观与状态" demo={Appearance}>
          <Code>icon</Code>、<Code>variant</Code>、<Code>size</Code>、<Code>radius</Code>{' '}
          与其他输入框同一套。只读时能聚焦、能看到已选的内容，不能打开、不能清空；Field 上的{' '}
          <Code>required</Code>、<Code>readonly</Code>、<Code>disabled</Code>、<Code>error</Code>{' '}
          都交给里面的 Select。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="custom" title="异步加载与自定义显示" demo={Members}>
          第一次打开时再去取选项：<Code>loading</Code>{' '}
          期间列表里是骨架行，已有选项时顶部显示进度条。
          <Code>renderValue</Code> 自定义触发框里的已选内容（这里是头像叠放加名字），返回 null
          时显示占位文字；分组来自选项的 <Code>group</Code>。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['↓ / Enter / Space', '关闭时：打开列表，高亮已选的项（没有时是第一项）'],
        ['↑', '关闭时：打开列表并高亮最后一项'],
        ['字母键', '关闭时（单选）：直接选中下一个以它开头的项；打开时移动高亮'],
        ['↓ / ↑', '打开时：移动高亮'],
        ['Home / End / PageUp / PageDown', '打开时：移到第一项、最后一项，或按一屏移动'],
        ['Enter / Space', '打开时：选中高亮的项；单选随后关闭，多选切换勾选'],
        ['Esc / Tab', '关闭列表；焦点一直在触发按钮上'],
      ]}
    >
      焦点一直留在触发按钮上，高亮项经 aria-activedescendant 告诉读屏。写了 <Code>name</Code>{' '}
      时用隐藏的 input 随表单提交（多选每个值一个）。数据层与{' '}
      <Link href="/components/listbox">Listbox</Link> 相同，选项多时虚拟滚动。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
