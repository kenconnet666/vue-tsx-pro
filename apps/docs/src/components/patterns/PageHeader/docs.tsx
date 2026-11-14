import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/PageHeaderProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Detail from './demo/Detail.tsx?demo';
import Simple from './demo/Simple.tsx?demo';

export const meta = {
  title: 'PageHeader 页头',
  description:
    '页面开头的那一块：面包屑、返回、标题与状态、说明、结束边的操作，下面接摘要或标签页；列表页、详情页、表单页不用各自拿 Flex 拼。',
  order: 1.5,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { PageHeader } from '@zerodep-dev/vue-tsx-pro-ui/patterns';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="detail" title="详情页" demo={Detail}>
          <Code>breadcrumbs</Code> 是面包屑（最后一项是当前页），<Code>meta</Code>{' '}
          放标题后面的状态、标签，<Code>actions</Code> 靠结束边、放不下时整块换到标题下面。给了{' '}
          <Code>onBack</Code> 就有返回按钮；给 <Code>backHref</Code>{' '}
          时返回是链接，能在新标签页打开。<Code>children</Code> 排在最下面，放摘要。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="simple" title="列表页：标题、说明与标签页" demo={Simple}>
          只写 <Code>title</Code> 就是一个 h1；标题与 <Code>description</Code> 在 hgroup
          里。标签页放在 <Code>children</Code>。页头嵌在页面里的一块（抽屉、分栏的右侧）时用{' '}
          <Code>headingLevel</Code> 把标题降到 h2、h3。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
