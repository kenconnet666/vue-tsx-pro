import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/DescriptionsProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Basic from './demo/Basic.tsx?demo';
import Layouts from './demo/Layouts.tsx?demo';

export const meta = {
  title: 'Descriptions 描述列表',
  description: '键值对的详情（订单信息、用户资料）：可分栏、可跨列，标签在左或在上，可带边框。',
  order: 5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Descriptions } from '@vue-tsx-pro/ui';">
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
          <Code>size</Code> 跟字号档位缩放。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
