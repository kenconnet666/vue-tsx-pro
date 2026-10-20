import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import tabApi from 'virtual:api/TabProps';
import tabListApi from 'virtual:api/TabListProps';
import tabPanelApi from 'virtual:api/TabPanelProps';
import api from 'virtual:api/TabsProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Orders from './demo/Orders.tsx?demo';
import Soft from './demo/Soft.tsx?demo';
import Vertical from './demo/Vertical.tsx?demo';

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
    <Examples>
      <Example id="line" title="订单状态" demo={Orders}>
        <Code>value</Code>{' '}
        双向绑定当前标签；标签里可以放任意内容（计数徽标）。下划线是一个指示条，切换时滑过去，减少动态效果时直接到位。
        整组只占一个 Tab 位置，方向键移动、Home / End 到两端。
      </Example>
      <Example id="soft" title="浅色底与手动切换" demo={Soft}>
        <Code>variant="soft"</Code> 像分段控件；<Code>activation="manual"</Code> 时按 Enter /
        空格才切换，适合切换代价大的内容。不写 value 时选中第一个标签。
      </Example>
      <Example id="vertical" title="竖排" demo={Vertical}>
        <Code>orientation="vertical"</Code>：标签在左、内容在右，键盘改用
        ↑↓。设置页这类分组多、标签文字长的场景。
        <Code>lazy</Code> 时面板第一次显示才渲染。
      </Example>
    </Examples>
    <ApiReference api={[api, tabListApi, tabApi, tabPanelApi]} />
  </DocPage>
));
