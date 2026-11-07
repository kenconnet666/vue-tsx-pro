import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Link } from '@zerodep-dev/vue-tsx-pro-ui';
import blockApi from 'virtual:api/CodeBlockProps';
import api from 'virtual:api/CodeProps';
import textApi from 'virtual:api/CodeTextProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Basic from './demo/Basic.tsx?demo';
import Block from './demo/Block.tsx?demo';
import Diff from './demo/Diff.tsx?demo';
import Flush from './demo/Flush.tsx?demo';
import Options from './demo/Options.tsx?demo';
import Text from './demo/Text.tsx?demo';

export const meta = {
  title: 'Code 代码',
  description:
    '行内代码（Code、文案里的 CodeText）与代码块（CodeBlock：标题、行号、高亮行、增删、折叠）。写文档站用的示例卡片、一组代码见文档工具页。',
  order: 10,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Code, CodeBlock, CodeText } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="行内代码" demo={Basic}>
          句子里的命令、文件名、标识符用 <Code>Code</Code>
          ：等宽字体、浅底，长内容可以在任意位置换行。
        </Example>
        <Example id="block" title="代码块" demo={Block}>
          <Code>CodeBlock</Code> 的高亮器经 <Code>createUi</Code> 的 <Code>highlighter</Code>{' '}
          注入（组件本身不依赖 Shiki），先显示纯文本、高亮结果到了再替换，布局不跳；
          <Code>lineNumbers</Code> 行号，<Code>highlightLines</Code> 高亮行，复制按钮在标题栏里。
        </Example>
        <Example id="options" title="换行、复制与延后高亮" demo={Options}>
          长行默认在浮层滚动条里横向滚动，<Code>wrap</Code> 改成自动换行；
          <Code>copyable={'{false}'}</Code> 去掉复制按钮。<Code>highlight={'{false}'}</Code>{' '}
          时按纯文本显示，改回 true 才交给高亮器：收起的、还没滚到的代码可以等要显示时再高亮。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="text" title="文案里的行内代码" demo={Text}>
          文案写在数据里时用 <Code>CodeText</Code>
          ：反引号里的是行内代码，不用拆成多个节点。只认成对的反引号，不是 Markdown。
        </Example>
        <Example id="diff" title="增删与折叠" demo={Diff}>
          <Code>addedLines</Code>、<Code>removedLines</Code> 标出新增与删除的行；长代码写{' '}
          <Code>maxLines</Code>，超出的部分折叠，底部的按钮展开或收起。
        </Example>
        <Example id="flush" title="嵌在外框里" demo={Flush}>
          <Code>flush</Code>{' '}
          去掉代码块自己的边框、圆角和底色，放进卡片、标签页这类已经有外框的容器。按标签切换的一组代码（
          <Link href="/components/docs-kit#code-group">CodeGroup</Link>）就是这样拼的。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, textApi, blockApi]} />
  </DocPage>
));
