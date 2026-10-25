import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ConditionBuilderProps';
import fieldApi from 'virtual:api/ConditionField';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Approval from './demo/Approval.tsx?demo';
import CustomInput from './demo/CustomInput.tsx?demo';
import Filter from './demo/Filter.tsx?demo';

export const meta = {
  title: 'ConditionBuilder 条件构造器',
  description:
    '编辑“字段 · 比较方式 · 值”加全部、任一、都不满足组合的条件树：流程连线的条件、列表的高级筛选。条件是纯 JSON，前后端各自求值。',
  order: 17,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ConditionBuilder, describeCondition, matchesCondition, type Condition, type ConditionField } from '@vue-tsx-pro/ui';"
  >
    <Example id="approval" title="审批条件" demo={Approval}>
      <Code>fields</Code> 给出字段的名字、显示名与类型（文字、数字、日期、选项、是否）。
      {
        '比较方式随类型（日期是早于、晚于，选项是“是其中之一”），值的输入随类型与比较方式（介于是两个框，是其中之一是多选）。'
      }
      组的表头选满足方式，组里还能加组。
      <Code>_value</Code> 只写回填完整的比较，一条也没有时是 <Code>null</Code>；
      <Code>describeCondition</Code> 把条件写成一句话（收起时的摘要、流程连线上的文字）。
    </Example>
    <Example id="filter" title="筛选本地数据" demo={Filter}>
      <Code>matchesCondition</Code> 在前端求值：同一份条件交给后端按同样的规则求值，结果一致。
      <Code>maxDepth={'{1}'}</Code> 不能加组，<Code>size="sm"</Code> 用小一档的控件。
    </Example>
    <Example id="custom-input" title="自己画值的输入" demo={CustomInput}>
      字段的 <Code>input</Code> 换掉值的输入（人员选择器、带单位的数字），比较方式仍按{' '}
      <Code>type</Code>；<Code>format</Code> 决定摘要里值的写法，<Code>group</Code> 把字段列表分组。
    </Example>
    <KeyboardReference
      keys={[
        ['Tab', '依次经过满足方式、每条的字段、比较方式、值、删除，最后是“添加条件”“添加条件组”'],
        ['↓ / Enter / Space', '打开字段、比较方式的列表（同 Select）'],
      ]}
    >
      {'整个构造器与每个嵌套的组是 role="group"，每条比较也是一组（“条件 2”）。'}
      {'三个控件各有名称（“字段”“比较方式”“金额的值”）。'}
      {'加了一条之后焦点落到它的字段上，删掉之后落到所在组的“添加条件”上。'}
    </KeyboardReference>
    <ApiReference api={[api, fieldApi]} />
  </DocPage>
));
