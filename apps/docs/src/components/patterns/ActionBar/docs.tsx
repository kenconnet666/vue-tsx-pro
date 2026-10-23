import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ActionBarProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Batch from './demo/Batch.tsx?demo';
import LongForm from './demo/LongForm.tsx?demo';

export const meta = {
  title: 'ActionBar 操作栏',
  description:
    '长表单、详情页底部的“撤销 / 保存 / 提交”：贴在滚动区域的底边，不用滚到底才能提交；起始边写未保存的改动、已选几项。',
  order: 4,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { ActionBar } from '@vue-tsx-pro/ui/patterns';">
    <Examples>
      <ExampleColumn>
        <Example id="long-form" title="长表单" demo={LongForm}>
          放在要跟着滚动的内容的最后：<Code>position: sticky</Code> 贴着最近的滚动容器（这里是
          ScrollArea，页面里就是整页）的底边。下面还有被盖住的字段时带阴影、
          <Code>data-stuck</Code>，提示还能往下滚；滚到底与内容平齐。<Code>start</Code>{' '}
          是起始边的说明，配合 <Code>form.dirty</Code>、<Code>form.isDirty(字段)</Code>{' '}
          写出改了几处；按钮放在 children 里，靠结束边排。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="batch" title="批量操作" demo={Batch}>
          <Code>{'sticky={false}'}</Code>{' '}
          是普通的一行：内容不长、或者外面已经固定了（对话框的底栏）时用。卡片写{' '}
          <Code>padding="none"</Code>，操作栏的上边线与卡片的边对齐。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
