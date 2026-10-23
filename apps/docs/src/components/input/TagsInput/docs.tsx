import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/TagsInputBaseProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Remote from './demo/Remote.tsx?demo';
import States from './demo/States.tsx?demo';
import Tags from './demo/Tags.tsx?demo';

export const meta = {
  title: 'TagsInput 标签输入',
  description: '输入多个值，每个显示成可移除的标签：话题、关键词、收件人；可以带建议列表。',
  order: 7,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { TagsInput } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="输入与建议" demo={Tags}>
          回车、逗号或分号加一个标签（<Code>delimiters</Code>{' '}
          可以改），粘贴时自动拆开，重复的不加；输入框空着时退格删掉最后一个。给了{' '}
          <Code>items</Code> 就有建议列表；
          <Code>allowCustomValue={'{false}'}</Code> 只能从建议里选。
        </Example>
        <Example id="remote" title="异步建议" demo={Remote}>
          <Code>inputValue</Code> 双向绑定输入框的文字，按它请求建议；
          <Code>filter={'{false}'}</Code> 不再本地过滤，<Code>loading</Code> 时建议列表显示加载中。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="states" title="上限、图标与状态" demo={States}>
          <Code>max</Code> 限制个数，满了以后输入框不再接受新的标签。<Code>icon</Code>、
          <Code>variant</Code>、<Code>size</Code> 与其他输入框同一套；只读时标签不能移除。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['Enter / , / ;', '把输入的文字加成标签（有建议列表且高亮了一项时，加入或移除那一项）'],
        ['Backspace', '输入框空着时删掉最后一个标签'],
        ['↓ / ↑', '有建议列表时移动高亮'],
        ['Esc', '关闭建议列表'],
        ['Tab', '标签的移除按钮在 Tab 顺序里，可以逐个删除'],
      ]}
    />
    <ApiReference api={api} />
  </DocPage>
));
