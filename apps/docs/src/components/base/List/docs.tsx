import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import itemApi from 'virtual:api/ListItemProps';
import api from 'virtual:api/ListProps';
import orderedApi from 'virtual:api/OrderedListProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Basic from './demo/Basic.tsx?demo';
import Features from './demo/Features.tsx?demo';

export const meta = {
  title: 'List 列表',
  description:
    '正文里的列表：圆点、编号、嵌套，或用图标代替圆点做功能清单。界面结构上的列表（导航、步骤）用 FlexList。',
  order: 3,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { List, ListItem, OrderedList } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="无序、有序与嵌套" demo={Basic}>
          <Code>List</Code> 是圆点，<Code>OrderedList</Code> 是编号，<Code>start</Code>、
          <Code>reversed</Code> 这些原生属性照常可用；嵌套的列表紧贴上一项。<Code>spacing</Code>{' '}
          改项与项之间的间距。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="icons" title="图标代替圆点" demo={Features}>
          <Code>icon</Code> 让每项前面画一个图标（功能清单的对勾），<Code>propsIcon</Code> 改颜色；
          <Code>ListItem</Code> 的 <Code>icon</Code> 逐项覆盖。图标是装饰，读屏照常念“列表，几项”。
          <Code>size</Code> 是字号档位。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, orderedApi, itemApi]} />
  </DocPage>
));
