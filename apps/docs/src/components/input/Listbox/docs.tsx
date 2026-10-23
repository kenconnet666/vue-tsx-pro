import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ListboxBaseProps';
import listboxViewApi from 'virtual:api/ListboxViewProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Columns from './demo/Columns.tsx?demo';
import Plans from './demo/Plans.tsx?demo';
import Remote from './demo/Remote.tsx?demo';

export const meta = {
  title: 'Listbox 列表框',
  description:
    '常驻在页面上的选项列表：表格显示哪些列、穿梭框的一侧、设置里的单选。一千个选项也只渲染看得见的几十个。',
  order: 8,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Listbox } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="multiple" title="多选与虚拟滚动" demo={Columns}>
          <Code>selectionMode="multiple"</Code>{' '}
          多选，选项多时虚拟滚动（只渲染看得见的几十个）；焦点在列表上，按字母跳转。列表默认最高
          20em，用 <Code>sx</Code> 改。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="single" title="单选、分组与说明" demo={Plans}>
          选项可以带 <Code>icon</Code>、<Code>description</Code>、<Code>group</Code>，
          <Code>disabled</Code> 的项高亮时跳过。<Code>required</Code>{' '}
          时单选至少保留一项，再点已选项不取消；在 Field 里时名称取 Field 的标签。
        </Example>
        <Example id="remote" title="远程搜索：加载、空结果与点选" demo={Remote}>
          <Code>loading</Code> 时没有选项显示骨架行，已有选项时顶部显示进度条，旧结果留着不闪；
          <Code>empty</Code> 换掉默认的空状态。<Code>onPick</Code> 在每次点选（点击或
          Enter）时调用，再点已选的那项也算，适合“选中即执行”。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['↓ / ↑', '移动高亮，跳过不可用的项'],
        ['Home / End / PageUp / PageDown', '移到第一项、最后一项，或按一屏移动'],
        ['字母键', '移到下一个以它开头的项'],
        ['Enter / Space', '选中高亮的项；多选时切换勾选'],
      ]}
    >
      整个列表只占一个 Tab 位置，高亮项经 aria-activedescendant 告诉读屏。
    </KeyboardReference>
    <ApiReference api={[api, listboxViewApi]} />
  </DocPage>
));
