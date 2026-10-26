import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/PropsTableProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Handwritten from './demo/Handwritten.tsx?demo';

export const meta = {
  title: 'PropsTable 属性表',
  description:
    '组件 API 的表格：名称、类型、默认值、说明，档位类的列出每个可选值。本站每页底部的 API 表就是它。',
  order: 12,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { PropsTable } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';"
  >
    <Example id="handwritten" title="给自己的组件写 API 表" demo={Handwritten}>
      数据类型是 <Code>ApiProp</Code>
      ：名称、种类（属性、事件、内容、部件属性）、类型、必填、默认值、能否 <Code>_bind</Code>
      、说明，档位类的 <Code>values</Code>{' '}
      列出每个可选值的含义。必填、可绑定的标记文案取语言包；外层是静态表格，窄屏时横向滚动。本站的
      API 表从类型与 JSDoc 自动生成同样的数据。外观属性同 Table：<Code>density</Code> 默认 compact，
      <Code>variant</Code>、<Code>striped</Code> 照常可用。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
