import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/DescriptionsProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Basic from './demo/Basic.tsx?demo';
import Layouts from './demo/Layouts.tsx?demo';
import Supplier from './demo/Supplier.tsx?demo';

export const meta = {
  title: 'Descriptions 描述列表',
  description: '键值对的详情（订单信息、用户资料）：可分栏、可跨列，标签在左或在上，可带边框。',
  order: 5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Descriptions } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="基础用法" demo={Basic}>
          <Code>items</Code> 每项一个标签与值，值可以是任意内容；<Code>columns</Code> 分栏，
          <Code>span</Code> 跨列。语义是 dl，读屏按“名称、值”念；容器窄于 32em 时自动排成一列。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="layouts" title="边框、竖排与尺寸" demo={Layouts}>
          <Code>bordered</Code> 是表格样式，<Code>layout="vertical"</Code> 标签在上，
          <Code>layout="inline"</Code> 各项一行排开、放不下换行（详情页页头里的编号、团队、主办），
          <Code>size</Code> 跟字号档位缩放。
        </Example>
      </ExampleColumn>
    </Examples>
    <Example id="auto" title="自适应栏数与复制：供应商档案" demo={Supplier}>
      <Code>columns="auto"</Code> 时按容器的宽度定栏数：每栏不窄于 <Code>minItemWidth</Code>（默认
      240px），最多 <Code>maxColumns</Code>（默认 4）栏，同一份详情放在抽屉、整页里各自合适；跨列（
      <Code>span</Code>）按算出的栏数封顶。项写 <Code>copyable</Code> 时值后面有复制按钮（名称“复制
      + 标签”），复制的是值的文字，值是图标、链接这类内容或要复制完整写法时用 <Code>copyText</Code>{' '}
      指定。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
