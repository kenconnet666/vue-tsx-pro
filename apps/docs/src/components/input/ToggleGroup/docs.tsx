import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ToggleGroupProps';
import itemApi from 'virtual:api/ToggleItemProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Format from './demo/Format.tsx?demo';
import Vertical from './demo/Vertical.tsx?demo';
import Views from './demo/Views.tsx?demo';

export const meta = {
  title: 'ToggleGroup 分段控件',
  description:
    '一组切换按钮：单选（视图切换、时间范围）或多选（字形）。选中项的底色滑过去；方向键在组内移动，整组只占一个 Tab 位置。',
  order: 11,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ToggleGroup, ToggleItem } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="segmented" title="视图切换" demo={Views}>
          单选时 <Code>_value</Code> 是字符串；<Code>required</Code> 时至少保留一项（分段控件）。
          <Code>icon</Code>{' '}
          放在文字前；选中项的底色是一个指示条，切换时滑过去，减少动态效果时直接到位。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="multiple" title="多选的字形" demo={Format}>
          <Code>selectionMode="multiple"</Code> 时 <Code>_value</Code>{' '}
          是数组，每一项各自开关（aria-pressed）。只有图标的项要写 <Code>aria-label</Code>。放进
          Toolbar 时焦点交给工具栏统一管理。
        </Example>
        <Example id="vertical" title="竖排与不可用" demo={Vertical}>
          <Code>orientation="vertical"</Code> 竖排，键盘改用 ↑↓。放进 Field 时以标签为名称，沿用
          Field 的不可用；单项可以单独不可用。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['Tab', '整组只占一个 Tab 位置，进来时落在已按下（或第一个）的项上'],
        ['→ / ↓ / ← / ↑', '按排列方向在组内移动焦点（漫游焦点），到头后循环；不改变选择'],
        ['Home / End', '移到第一项 / 最后一项'],
        ['Enter / Space', '按下或弹起聚焦的项；required 的单选组不能把唯一按下的项弹起'],
      ]}
    />
    <ApiReference api={[api, itemApi]} />
  </DocPage>
));
