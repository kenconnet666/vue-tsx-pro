import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/NumberFieldProps';
import rangeApi from 'virtual:api/NumberRangeFieldProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Appearance from './demo/Appearance.tsx?demo';
import Basic from './demo/Basic.tsx?demo';
import Precise from './demo/Precise.tsx?demo';
import Range from './demo/Range.tsx?demo';
import Submit from './demo/Submit.tsx?demo';
import Units from './demo/Units.tsx?demo';

export const meta = {
  title: 'NumberField 数字输入框',
  description: '输入数字，方向键与按钮加减，按语言格式化；值可以是 number、bigint 或 Decimal。',
  order: 2,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { NumberField, NumberRangeField } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="基础用法" demo={Basic}>
          输入时是普通文字，失焦或回车时解析、夹到 <Code>min</Code>–<Code>max</Code>、对齐到{' '}
          <Code>step</Code>；解析不了时恢复原值，清空写回 <Code>null</Code>。<Code>format</Code> 是
          Intl.NumberFormat 的选项，认当前语言的小数点与千分位，也认中文输入法打出的全角数字。
        </Example>
        <Example id="precise" title="精确数值" demo={Precise}>
          值可以是 decimal.js 的 <Code>Decimal</Code> 或 <Code>bigint</Code>
          ，写回时保持传入的类型，加减与对齐步长都精确运算，不经过浮点数。一开始为空时用{' '}
          <Code>valueType</Code>（<Code>'bigint'</Code> 或 Decimal 构造函数）指定写回的类型。
        </Example>
        <Example id="units" title="单位与缩放" demo={Units}>
          <Code>suffix</Code>、<Code>prefix</Code> 把单位放进输入框。值以元保存、按万元输入时写{' '}
          <Code>{'format={{ scale: 10_000 }}'}</Code>：显示与编辑都是万元，写回时按十进制移位回元；
          <Code>min</Code>、<Code>max</Code>、<Code>step</Code>{' '}
          仍按值本身的单位。只读时不显示加减按钮。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="appearance" title="外观与状态" demo={Appearance}>
          外观同 TextField：<Code>variant</Code>、<Code>size</Code>、<Code>radius</Code>
          ；减少、增加按钮不在 Tab 顺序里，按住时连续加减。
        </Example>
        <Example id="submit" title="表单提交" demo={Submit}>
          写了 <Code>name</Code>{' '}
          时，原生表单提交的是十进制文本（不带千分位与货币符号），不是输入框里显示的格式。
        </Example>
        <Example id="range" title="数值区间" demo={Range}>
          <Code>NumberRangeField</Code> 是两个数字框，值是 <Code>[起, 止]</Code>，任一端可以为{' '}
          <Code>null</Code>（不限）；两端都填了、起比止大时自动对调。<Code>min</Code>、
          <Code>format</Code>、<Code>suffix</Code> 与外观（<Code>variant</Code>、<Code>size</Code>、
          <Code>radius</Code>）两端共用；在 Field 里时组以标签为名称，两个框各自念“最小值”“最大值”。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['↑ / ↓', '加减一个 step'],
        ['PageUp / PageDown', '加减一个 bigStep'],
        ['Home / End', '到 min / max（有设时）'],
        ['Enter', '按当前输入格式化并写回'],
      ]}
    >
      输入框是 role="spinbutton"；加减按钮不在 Tab 顺序里（键盘用方向键），指针按住时连续加减。
    </KeyboardReference>
    <ApiReference api={[api, rangeApi]} />
  </DocPage>
));
