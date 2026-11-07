import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ColorFieldProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Brand from './demo/Brand.tsx?demo';
import Formats from './demo/Formats.tsx?demo';
import States from './demo/States.tsx?demo';

export const meta = {
  title: 'ColorField 颜色输入',
  description: '颜色输入：色块点开取色器（ColorPicker），后面可以直接输入颜色值。',
  order: 12,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { ColorField } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="brand" title="品牌配色" demo={Brand}>
          值是 <Code>#rrggbb</Code>（有透明度时 <Code>#rrggbbaa</Code>
          ），点色块弹出取色器，拖动时实时写回；<Code>presets</Code>{' '}
          是取色器里的预设（这里是品牌色板），<Code>alpha={'{false}'}</Code>{' '}
          去掉不透明度。外观、Field 关联与 TextField 相同。
        </Example>
        <Example id="formats" title="格式与透明度" demo={Formats}>
          能输入任何 CSS 颜色，失焦或回车时规范成 #hex；写不成颜色时标为无效、值不变，失焦后恢复。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="states" title="外观与状态" demo={States}>
          <Code>variant</Code>、<Code>size</Code>、<Code>radius</Code> 与其他输入框同一套；Field
          上的 <Code>required</Code>、<Code>error</Code>、<Code>readonly</Code>、
          <Code>disabled</Code> 交给里面的 ColorField。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['Enter', '在文字输入框里：按当前文字解析颜色并写回；解析不了时恢复原值'],
        ['Enter / Space', '在色块上：打开取色器（键盘操作见 ColorPicker）；Esc 关上，焦点回到色块'],
        ['Tab', '色块与文字输入框各占一个 Tab 位置'],
      ]}
    />
    <ApiReference api={api} />
  </DocPage>
));
