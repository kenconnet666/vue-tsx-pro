import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/EllipsisProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Expand from './demo/Expand.tsx?demo';
import Suppliers from './demo/Suppliers.tsx?demo';

export const meta = {
  title: 'Ellipsis 截断文字',
  description:
    '超出一行或几行时省略：真的被截断了才给出看全文的办法（悬停、聚焦时的提示，或展开按钮），没截断时就是普通文字。',
  order: 16,
};

export default _component(() => () => (
  <DocPage meta={meta} imports="import { Ellipsis } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="tooltip" title="截断时才有提示" demo={Suppliers}>
          是否截断由 ResizeObserver 量出，宽度、内容变了重新量（拖动滑块试试）。截断时文字能用 Tab
          聚焦，悬停或聚焦显示全文（Tooltip，经 aria-describedby
          关联）；没截断时就是普通文字，不多一个 Tab 停留。只要省略、不需要看全文时用 Text 的{' '}
          <Code>truncate</Code> / <Code>lineClamp</Code>。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="expand" title="多行与展开" demo={Expand}>
          <Code>lines</Code> 是最多几行，<Code>expandable</Code>{' '}
          在截断时后面放“展开”，展开后显示全部、按钮换成“收起”（aria-expanded）；写了 expandable
          时默认不再给提示。<Code>_expanded</Code> 可以双向绑定，<Code>tooltip</Code>{' '}
          换提示的内容或写 false 关掉。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
