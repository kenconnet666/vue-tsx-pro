import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/AutocompleteProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Email from './demo/Email.tsx?demo';
import Options from './demo/Options.tsx?demo';
import Remote from './demo/Remote.tsx?demo';

export const meta = {
  title: 'Autocomplete 自动完成',
  description:
    '带建议的输入框：值就是输入的文字，列表只是建议（邮箱后缀、常用地址、供应商名称），选一项就是把它填进来。',
  order: 7,
};

export default _component(() => () => (
  <DocPage meta={meta} imports="import { Autocomplete } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="email" title="邮箱后缀" demo={Email}>
          <Code>_value</Code> 就是输入框里的文字，不选建议也行；要从固定的选项里选一个（值是选项的
          value）时用 Combobox。建议可以随输入算出来，配 <Code>filter={'{false}'}</Code>{' '}
          不再本地过滤；没有可选的建议时不弹出列表。写了 <Code>name</Code> 时表单提交的是文字。
        </Example>
        <Example id="options" title="对象数据、外观与状态" demo={Options}>
          建议可以是任意数据，<Code>toOption</Code> 把它映射成选项：<Code>label</Code>{' '}
          是填进输入框的文字，<Code>description</Code>、<Code>icon</Code>、<Code>group</Code>{' '}
          照常显示在列表里。<Code>variant</Code>、<Code>size</Code>、<Code>radius</Code>{' '}
          与其他输入框同一套；必填、出错、只读、不可用可以写在外面的 Field
          上，也可以直接写在组件上。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="remote" title="远程建议" demo={Remote}>
          <Code>load(输入, signal)</Code> 在输入停下 300 ms 后请求，只采用最后一次，被顶掉的请求经
          signal 中止（同 Combobox、Select）。系统里还没有的名称直接写全称，提交时再建。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['↓', '打开建议'],
        ['↑ / ↓', '在建议之间移动（焦点留在输入框里）'],
        ['Enter', '把高亮的建议填进来'],
        ['Esc', '关闭建议；已关闭时清空输入'],
      ]}
    />
    <ApiReference api={api} />
  </DocPage>
));
