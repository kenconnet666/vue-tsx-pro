import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/NumberFieldProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Appearance from './demo/Appearance.tsx?demo';
import Basic from './demo/Basic.tsx?demo';
import Precise from './demo/Precise.tsx?demo';
import Submit from './demo/Submit.tsx?demo';

export const meta = {
  title: 'NumberField 数字输入框',
  description: '输入数字，方向键与按钮加减，按语言格式化；值可以是 number、bigint 或 Decimal。',
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { NumberField } from '@vue-tsx-pro/ui';">
    <Examples>
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
      <Example id="appearance" title="外观与状态" demo={Appearance}>
        外观同 TextField：<Code>variant</Code>、<Code>size</Code>、<Code>radius</Code>
        ；减少、增加按钮不在 Tab 顺序里，按住时连续加减。
      </Example>
      <Example id="submit" title="表单提交" demo={Submit}>
        写了 <Code>name</Code>{' '}
        时，原生表单提交的是十进制文本（不带千分位与货币符号），不是输入框里显示的格式。
      </Example>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
