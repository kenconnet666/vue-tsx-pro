import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/CommentThreadProps';
import itemApi from 'virtual:api/CommentItem';
import composerApi from 'virtual:api/CommentComposerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Discussion from './demo/Discussion.tsx?demo';
import Negotiation from './demo/Negotiation.tsx?demo';

export const meta = {
  title: 'CommentThread 留言',
  description:
    '一串留言与回复（沟通记录、协商的逐条回应、审批时的讨论）：@ 提及、附件、身份标记，下面是写留言的输入框。',
  order: 6.5,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { CommentThread, CommentComposer } from '@vue-tsx-pro/ui/patterns';"
  >
    <Examples>
      <ExampleColumn wide>
        <Example id="discussion" title="沟通记录" demo={Discussion}>
          <Code>comments</Code> 是留言，旧的在前，回复在各自的 <Code>replies</Code>{' '}
          里（只分一层：回复一条回复时仍挂在那一串下面，开头写上“@作者 ”）。
          <Code>people</Code> 是可以 @ 的人，也是留言里“@名字”高亮的依据；<Code>upload</Code>{' '}
          给了才能带附件。<Code>onSend</Code> 收到内容、提到的人、上传完的附件与{' '}
          <Code>replyTo</Code>，返回 Promise
          时按钮转圈，成功后清空，失败时保留内容并提示；留言存在哪、怎样出现在列表里由应用决定。
          <Code>role</Code> 是名字后面的身份标记，
          <Code>actions</Code> 给每条加操作（编辑、删除），时间写成相对现在、悬停看完整时间。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="negotiation" title="协商的逐条回应（只读）" demo={Negotiation}>
          不给 <Code>onSend</Code> 时只读，没有输入框与回复按钮。<Code>extra</Code>{' '}
          放在内容下面：回应的结论、改了的字段（FieldCompare）。<Code>now</Code>{' '}
          固定“现在”（演示数据、截图）。单独的输入框（协商回复、审批意见）用{' '}
          <Code>CommentComposer</Code>。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['Ctrl+Enter', '发送'],
        ['Esc', '取消回复（提及列表打开时先关列表）'],
        ['@', '提及（见 Mentions）'],
      ]}
    >
      留言列表是 ul，每条是 article（名称是作者），回复是嵌套的列表，读屏念出几条回复。
    </KeyboardReference>
    <ApiReference api={[api, itemApi, composerApi]} />
  </DocPage>
));
