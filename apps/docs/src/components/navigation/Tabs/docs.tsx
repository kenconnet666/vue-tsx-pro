import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import tabApi from 'virtual:api/TabProps';
import tabListApi from 'virtual:api/TabListProps';
import tabPanelApi from 'virtual:api/TabPanelProps';
import api from 'virtual:api/TabsProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Orders from './demo/Orders.tsx?demo';
import Soft from './demo/Soft.tsx?demo';
import Vertical from './demo/Vertical.tsx?demo';
import Workspace from './demo/Workspace.tsx?demo';

export const meta = {
  title: 'Tabs 标签页',
  description:
    '同一区域里切换几组内容：Tabs 管状态，TabList、Tab、TabPanel 各是独立的组件，自由排版。下划线、浅色底两种样式，横排、竖排。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Tab, TabList, TabPanel, Tabs } from '@vue-tsx-pro/ui';"
  >
    <Example id="workspace" title="多页签：关闭、新建、拖动与全部标签页" demo={Workspace}>
      <Code>Tab</Code> 写了 <Code>onClose</Code> 就有关闭按钮（不进 Tab 顺序，焦点在标签上时按
      Delete，鼠标中键也关）；关掉的是当前标签时选它后面的一个，焦点跟过去。
      <Code>TabList</Code> 的 <Code>onAdd</Code> 在标签栏末尾放“新建标签页”，<Code>onReorder</Code>{' '}
      让标签能拖动排序（键盘：Alt + ← →），参数是新的顺序；<Code>showAllMenu</Code>{' '}
      在右边放“全部标签页”的菜单。放不下时列表横向滚动，两端出现滚动按钮，切到的标签自己滚进来。
    </Example>
    <Examples>
      <ExampleColumn>
        <Example id="line" title="订单状态" demo={Orders}>
          <Code>value</Code>{' '}
          双向绑定当前标签；标签里可以放任意内容（计数徽标）。下划线是一个指示条，切换时滑过去，减少动态效果时直接到位。整组只占一个
          Tab 位置，方向键移动、Home / End 到两端。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="soft" title="浅色底与手动切换" demo={Soft}>
          <Code>variant="soft"</Code> 像分段控件；<Code>activation="manual"</Code> 时按 Enter /
          空格才切换，适合切换代价大的内容。不写 value 时选中第一个标签。
        </Example>
        <Example id="vertical" title="竖排" demo={Vertical}>
          <Code>orientation="vertical"</Code>：标签在左、内容在右，键盘改用
          ↑↓。设置页这类分组多、标签文字长的场景。
          <Code>lazy</Code> 时面板第一次显示才渲染。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['Tab', '标签栏只占一个 Tab 位置（停在当前标签上），再按 Tab 进入面板'],
        ['→ / ←', '移到下一个 / 上一个标签（竖排时用 ↓ / ↑）；loop 时到头后循环'],
        ['Home / End', '移到第一个 / 最后一个标签'],
        ['Enter / Space', 'activation="manual" 时切换到聚焦的标签；默认焦点移到哪个就切换到哪个'],
        ['Delete', '关闭聚焦的标签（写了 onClose 时）'],
        ['Alt + → / ←', '把聚焦的标签往后 / 往前挪一位（写了 onReorder 时；从右到左排版时反过来）'],
      ]}
    />
    <ApiReference api={[api, tabListApi, tabApi, tabPanelApi]} />
  </DocPage>
));
