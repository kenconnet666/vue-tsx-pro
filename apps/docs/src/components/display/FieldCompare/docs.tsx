import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/FieldCompareProps';
import fieldApi from 'virtual:api/CompareField';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Changes from './demo/Changes.tsx?demo';
import Versions from './demo/Versions.tsx?demo';

export const meta = {
  title: 'FieldCompare 字段对比',
  description:
    '两份记录按字段列出原值与新值（测算版本对比、编辑前后、审批前后），数值字段带变化量与变化率，按好坏着色。',
  order: 5.5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { FieldCompare } from '@vue-tsx-pro/ui';">
    <Example id="versions" title="版本对比：表格" demo={Versions}>
      <Code>fields</Code> 的写法与表格的列相同（<Code>key</Code>、<Code>header</Code>、
      <Code>type</Code>、<Code>format</Code>、<Code>statuses</Code>、<Code>value</Code>
      ），表格里的列定义可以直接拿来用。默认是字段、原值、新值、变化四列，列出全部字段、没改的淡显，
      <Code>onlyChanged</Code> 只列改了的。两边都是数值时给出变化量（按字段的格式、带正负号，Decimal
      精确计算）与变化率；
      <Code>better</Code> 写 <Code>'lower'</Code>（成本、单价）或 <Code>'higher'</Code>
      （降本率、产量）时按好坏着色。比较建在 <Code>diffFields</Code> 上，要自己排版时直接用它。
    </Example>
    <Example id="changes" title="编辑前后：列表" demo={Changes}>
      <Code>layout="list"</Code>{' '}
      一行一个字段：原值划掉、箭头、新值，默认只列改了的，放在保存前的确认、审批意见、时间线的一项里（见
      Timeline 的操作记录）。原值是 del、新值是 ins，中间有给读屏的“改为”；
      <Code>before</Code> 为空（新建）时只列新值，什么都没改时显示“没有改动”（语言包可改）。
    </Example>
    <ApiReference api={[api, fieldApi]} />
  </DocPage>
));
