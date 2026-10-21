import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import api from 'virtual:api/DateFieldProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { Example } from '../../../site/Example';
import Appearance from './demo/Appearance.tsx?demo';
import Basic from './demo/Basic.tsx?demo';
import Granularity from './demo/Granularity.tsx?demo';
import Locales from './demo/Locales.tsx?demo';

export const meta = {
  title: 'DateField 日期输入框',
  description:
    '分段输入年、月、日（可选时、分、秒），不带弹层；知道确切日期时比翻日历快，生日、证件有效期。',
  order: 3,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { DateField } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="基础用法" demo={Basic}>
          每段单独聚焦、单独输入：打一个数字后再打一个就会超出范围时直接跳到下一段（月份打{' '}
          <Kbd>3</Kbd> 就跳走，打 <Kbd>1</Kbd> 等第二位）；<Kbd>↑</Kbd> <Kbd>↓</Kbd> 加减，
          <Kbd>Backspace</Kbd> 删一位，删空回到上一段。所有段都填了才写回 ISO 日期，删掉一段写回{' '}
          <Code>null</Code>；超出 <Code>min</Code> / <Code>max</Code> 时外壳显示出错，写了{' '}
          <Code>name</Code> 时随表单提交。
        </Example>
        <Example id="granularity" title="精确到哪一段" demo={Granularity}>
          <Code>granularity</Code> 从 <Code>year</Code> 到 <Code>second</Code>
          ，值的格式与原生输入框一致：
          <Code>'2026-10'</Code>、<Code>'2026-10-20'</Code>、<Code>'2026-10-20T14:30'</Code>。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="locales" title="段的顺序跟随语言" demo={Locales}>
          段的顺序、分隔符、12 / 24 小时制都取自 Intl；每段是 <Code>role="spinbutton"</Code>
          ，读屏念“生日 年”“生日 月”，没填的段念“未填写”。段可以编辑（<Code>
            contenteditable
          </Code>{' '}
          加 <Code>inputmode="numeric"</Code>），手机上弹出数字键盘，输入法打的全角数字也认。
        </Example>
        <Example id="appearance" title="外观与状态" demo={Appearance}>
          和 TextField 同一个输入框外壳，<Code>createUi</Code> 的 <Code>defaults.Input</Code>{' '}
          一起生效。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
