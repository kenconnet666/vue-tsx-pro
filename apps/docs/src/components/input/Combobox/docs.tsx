import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ComboboxBaseProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Cities from './demo/Cities.tsx?demo';
import Freeform from './demo/Freeform.tsx?demo';

export const meta = {
  title: 'Combobox 输入选择',
  description:
    '边输入边筛选的下拉框：选项多时先打几个字缩小范围；可以远程搜索，也可以允许输入选项之外的文字。',
  order: 5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Combobox } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="本地筛选与远程搜索" demo={Cities}>
          默认本地筛选（忽略大小写与重音），中文输入法组合期间不拿拼音去筛选。远程搜索给{' '}
          <Code>load(输入, signal)</Code>：输入停下 300 ms 后请求，只采用最后一次，被顶掉的请求经
          signal 中止；自己管请求时写 <Code>filter={'{false}'}</Code>，按 <Code>inputValue</Code> 换{' '}
          <Code>items</Code>、配合 <Code>loading</Code>。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="freeform" title="自由输入、图标与状态" demo={Freeform}>
          <Code>allowCustomValue</Code> 允许输入选项里没有的文字：失焦时保留，<Code>value</Code> 为
          undefined、文字在 <Code>inputValue</Code> 里。<Code>icon</Code>、<Code>variant</Code>、
          <Code>radius</Code> 与只读、不可用同其他输入框。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['↓', '打开列表'],
        ['↓ / ↑ / PageDown / PageUp', '移动高亮；焦点留在输入框里'],
        ['Enter', '选中高亮的项，填进输入框并关闭'],
        ['Esc', '关闭列表；已经关闭时清空输入'],
        ['Home / End', '照常移动光标（不移动高亮）'],
      ]}
    />
    <ApiReference api={api} />
  </DocPage>
));
