import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/BreadcrumbsProps';
import stepsApi from 'virtual:api/StepsProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Checkout from './demo/Checkout.tsx?demo';
import Deploy from './demo/Deploy.tsx?demo';
import Paths from './demo/Paths.tsx?demo';

export const meta = {
  title: 'Breadcrumbs 面包屑与步骤',
  description:
    '当前在哪：面包屑是页面在站点层级里的位置，步骤条是多步流程里的位置。都是有序列表，当前项带 aria-current。',
  order: 3,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Breadcrumbs, Steps } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="breadcrumbs" title="面包屑" demo={Paths}>
          最后一项是当前页（aria-current="page"），不是链接；站内链接经路由适配不刷新页面。路径太长时{' '}
          <Code>maxItems</Code> 把中间几级收进菜单（同 Radix
          Themes），不会把布局撑乱。分隔符从右到左排版时翻转。
        </Example>
        <Example id="steps" title="下单流程" demo={Checkout}>
          <Code>current</Code> 是当前步骤的序号；给了 <Code>onStepChange</Code>{' '}
          时已完成的步骤可以点回去。已完成的显示对勾，当前步骤带
          aria-current="step"，图标可以自定义。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="vertical" title="竖排与出错" demo={Deploy}>
          <Code>orientation="vertical"</Code> 适合说明文字长的流程；<Code>error</Code>{' '}
          标出出错的步骤，<Code>disabled</Code> 的步骤不能点。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, stepsApi]} />
  </DocPage>
));
