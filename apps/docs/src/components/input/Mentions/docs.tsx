import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/MentionsBaseProps';
import textApi from 'virtual:api/MentionTextProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Approval from './demo/Approval.tsx?demo';
import Remote from './demo/Remote.tsx?demo';

export const meta = {
  title: 'Mentions 提及',
  description:
    '多行文本框里输入 @ 弹出人员列表，选中后写成“@名字”；mentions 给出提到了谁，MentionText 显示时高亮提及。',
  order: 7.5,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Mentions, MentionText, mentionSegments } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="approval" title="审批意见" demo={Approval}>
          <Code>items</Code>{' '}
          是可以提及的人（选项的分组、说明照常显示）。输入框还是文字：选中一项写成“@名字 ”，
          <Code>mentions</Code>{' '}
          是文字里提到的人的值，随文字增删——删掉“@名字”就不再算；父级给的文字里已有的提及也认得出来。@
          在开头或前面不是字母数字时才弹出（邮箱不算），@ 与光标之间有空白就收起。显示留言时用{' '}
          <Code>MentionText</Code> 高亮提及，要自己排版时用 <Code>mentionSegments</Code> 拆分。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="remote" title="远程搜索与自定义选项" demo={Remote}>
          <Code>load</Code> 按 @ 后面的文字搜索（停下 300 ms 后请求，只采用最后一次，被顶掉的请求经
          signal 中止），选项用 <Code>toOption</Code> 映射、<Code>children</Code>{' '}
          自己渲染。搜索换掉选项之后，提及过的人仍按见过的选项认出来。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['@', '弹出可以提及的人（开头或前面不是字母数字时）'],
        ['↑ / ↓', '移动高亮'],
        ['Enter / Tab', '选中高亮的人，写成“@名字 ”'],
        ['Esc', '关闭列表；这个 @ 不再弹出，直到重新输入'],
      ]}
    >
      焦点一直在文本框里，高亮项经 aria-activedescendant
      告诉读屏，匹配的数量会播报；中文输入法组合期间不弹出、不过滤。
    </KeyboardReference>
    <ApiReference api={[api, textApi]} />
  </DocPage>
));
