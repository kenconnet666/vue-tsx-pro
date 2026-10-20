import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ToolbarProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Editor from './demo/Editor.tsx?demo';
import Tools from './demo/Tools.tsx?demo';

export const meta = {
  title: 'Toolbar 工具栏',
  description:
    '一组相关的按钮：整组只占一个 Tab 位置，组内用方向键移动（WAI-ARIA Toolbar 模式），键盘用户不必一个个 Tab 过去。',
  order: 5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Toolbar } from '@vue-tsx-pro/ui';">
    <Examples>
      <Example id="editor" title="编辑器工具栏" demo={Editor}>
        <Kbd>Tab</Kbd> 进入工具栏，<Kbd>←</Kbd> <Kbd>→</Kbd> 在按钮之间移动，<Kbd>Home</Kbd> /{' '}
        <Kbd>End</Kbd> 到两端，再按 <Kbd>Tab</Kbd> 离开。里面可以放 ToggleGroup、Select
        和分隔线；名称写在 <Code>aria-label</Code>。
      </Example>
      <Example id="vertical" title="竖排的绘图工具" demo={Tools}>
        <Code>orientation="vertical"</Code> 时用 <Kbd>↑</Kbd> <Kbd>↓</Kbd> 移动。选中的工具用{' '}
        <Code>aria-pressed</Code> 告诉读屏；图标按钮配 Tooltip 说明用途。
      </Example>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
