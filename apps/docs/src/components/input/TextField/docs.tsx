import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import countApi from 'virtual:api/CharacterCountProps';
import textareaApi from 'virtual:api/TextareaProps';
import api from 'virtual:api/TextFieldProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Appearance from './demo/Appearance.tsx?demo';
import Comment from './demo/Comment.tsx?demo';
import Signup from './demo/Signup.tsx?demo';

export const meta = {
  title: 'TextField 文本框',
  description:
    '单行的 TextField 与自动增高的 Textarea：前后图标、固定的前后缀、一键清空、显示密码、字数计数；放进 Field 自动关联标签、说明与错误。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { CharacterCount, TextField, Textarea } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="form" title="注册表单" demo={Signup}>
          放进 <Code>Field</Code>：标签、说明、错误自动经 aria-labelledby / aria-describedby
          关联，并沿用 Field 的必填、不可用。<Code>type="password"</Code> 带显示密码的按钮；
          <Code>prefix</Code> / <Code>suffix</Code> 是固定的文字（区号、域名），不进值里；
          <Code>maxlength</Code> 加 <Code>showCount</Code> 显示字数。中文输入法组合期间不写回。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="appearance" title="样式、尺寸与状态" demo={Appearance}>
          <Code>variant</Code> 有描边（surface）与浅底（soft），<Code>size</Code> 对应字号档位，
          <Code>radius</Code> 同按钮。不可用、只读、校验未通过的外观由 Field 统一给。
        </Example>
        <Example id="textarea" title="Textarea" demo={Comment}>
          高度随内容在 <Code>rows</Code> 与 <Code>maxRows</Code> 之间增长（父级改值也会跟着变）；
          <Code>fixed</Code>{' '}
          关掉自动增高、允许拖动调整。字数计数超出上限时变成危险色，读屏念完整的句子。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, textareaApi, countApi]} />
  </DocPage>
));
