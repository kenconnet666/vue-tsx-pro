import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import blockApi from 'virtual:api/CodeBlockProps';
import groupApi from 'virtual:api/CodeGroupProps';
import api from 'virtual:api/CodeProps';
import previewApi from 'virtual:api/CodePreviewProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Basic from './demo/Basic.tsx?demo';
import Block from './demo/Block.tsx?demo';
import Diff from './demo/Diff.tsx?demo';
import Group from './demo/Group.tsx?demo';
import Options from './demo/Options.tsx?demo';
import Preview from './demo/Preview.tsx?demo';

export const meta = {
  title: 'Code 代码',
  description:
    '行内代码（Code）、代码块（CodeBlock：标题、行号、高亮行、增删、折叠）、按标签切换的一组代码（CodeGroup）与示例卡片（CodePreview）。',
  order: 10,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports={
      "import { Code, CodeBlock } from '@vue-tsx-pro/ui';\nimport { CodeGroup, CodePreview } from '@vue-tsx-pro/ui/docs-kit';"
    }
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
        <Example id="diff" title="增删与折叠" demo={Diff}>
          <Code>addedLines</Code>、<Code>removedLines</Code> 标出新增与删除的行；长代码写{' '}
          <Code>maxLines</Code>，超出的部分折叠，底部的按钮展开或收起。
        </Example>
        <Example id="group" title="一组代码" demo={Group}>
          <Code>CodeGroup</Code> 用标签页切换几段代码，标签栏就是代码块的标题栏；几组绑同一个{' '}
          <Code>value</Code> 就一起切换。
        </Example>
        <Example id="preview" title="示例卡片" demo={Preview}>
          <Code>CodePreview</Code>{' '}
          上面是运行中的效果、下面是源码（默认收起，可复制），文档站的每个示例都是一张；
          <Code>showCode</Code> 可以双向绑定源码的展开状态，<Code>actions</Code>{' '}
          往工具栏最前面加按钮。<Code>code</Code> 也可以是返回 Promise
          的函数：源码在指针移到工具栏上、或展开时才加载。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, blockApi, groupApi, previewApi]} />
  </DocPage>
));
