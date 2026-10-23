import { _component } from '@vue-tsx-pro/tsx';
import { Code, Link } from '@vue-tsx-pro/ui';
import api from 'virtual:api/SelectBaseProps';
import listPopoverApi from 'virtual:api/ListPopoverProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Appearance from './demo/Appearance.tsx?demo';
import Assign from './demo/Assign.tsx?demo';
import Members from './demo/Members.tsx?demo';
import Searchable from './demo/Searchable.tsx?demo';

export const meta = {
  title: 'Select 下拉选择',
  description:
    '点开一列选项选一个或几个，同原生 select 的交互。要边输入边筛选用 Combobox，输入多个标签用 TagsInput，平铺在页面上用 Listbox。',
  order: 5,
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
        <Example id="searchable" title="可搜索" demo={Searchable}>
          选项多（供应商、人员、件号）时写 <Code>searchable</Code>
          ：弹出层顶部是搜索框，打开后焦点就在里面，输入即按显示文字过滤（忽略大小写与重音，
          <Code>filter</Code> 可以换规则；createUi 配了{' '}
          <Code>textMatcher: createPinyinMatcher()</Code>{' '}
          时也认拼音与首字母，本站已开启，试试输入“xnyy”（西南液压），↑↓ 移动、Enter 选中，Esc
          关闭并把焦点还给触发按钮。已选的项被过滤掉、或 items
          换成了另一页的搜索结果时，触发框里照样显示它的文字。远程搜索给 <Code>load</Code>{' '}
          （见下一个示例）；自己管请求时用 <Code>search={'{_bind(keyword)}'}</Code> 拿到搜索词、
          <Code>filter={'{false}'}</Code> 关掉本地过滤。
        </Example>
        <Example id="custom" title="异步加载与自定义显示" demo={Members}>
          <Code>load(搜索词, signal)</Code> 在打开时请求（searchable 时搜索词停下 300 ms
          再请求），只采用最后一次，请求期间列表里是骨架行，失败时提示重试；<Code>items</Code>{' '}
          是第一次结果之前的选项（编辑页放上已选的那几项）。
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
        [
          '输入（searchable）',
          '打开时焦点在搜索框里：输入过滤选项，↑↓、Enter 同上，Esc 关闭并回到触发按钮',
        ],
      ]}
    >
      焦点一直留在触发按钮上，高亮项经 aria-activedescendant 告诉读屏。写了 <Code>name</Code>{' '}
      时用隐藏的 input 随表单提交（多选每个值一个）。数据层与{' '}
      <Link href="/components/listbox">Listbox</Link> 相同，选项多时虚拟滚动。
    </KeyboardReference>
    <ApiReference api={[api, listPopoverApi]} />
  </DocPage>
));
