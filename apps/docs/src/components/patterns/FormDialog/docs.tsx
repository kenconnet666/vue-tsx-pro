import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import fieldApi from 'virtual:api/FormDialogField';
import api from 'virtual:api/FormDialogOptions';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Prompt from './demo/Prompt.tsx?demo';
import Reschedule from './demo/Reschedule.tsx?demo';

export const meta = {
  title: 'useFormDialog 表单对话框',
  description:
    '命令式的小表单对话框：退回要写原因、改派要选人、调整日期要说明理由，一行 await 拿到填好的值，不用为每个操作单独写一个对话框。',
  order: 5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { useFormDialog } from '@vue-tsx-pro/ui/patterns';">
    <Examples>
      <ExampleColumn>
        <Example id="prompt" title="退回与改派" demo={Prompt}>
          在 setup 里调用 <Code>useFormDialog()</Code> 得到 <Code>prompt(options)</Code>，await
          得到填好的值，取消或 <Kbd>Esc</Kbd> 时是 null。<Code>required</Code> 与{' '}
          <Code>validate</Code> 的错误落在字段下面、不提交；<Code>tone</Code>{' '}
          是确认按钮的色调，退回、驳回这类用
          danger。对话框渲染在组件树之外，沿用调用处的主题与语言。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="reschedule" title="日期、带说明的选项与提交失败" demo={Reschedule}>
          <Code>type</Code> 有 text、textarea、select、date：日期的值是 ISO 字符串，
          <Code>min</Code> / <Code>max</Code> 限定可选范围；选项的 <Code>description</Code>{' '}
          是第二行说明。<Code>validate</Code>{' '}
          的第二个参数是全部字段的值，可以做跨字段校验（选了“其他”才要求说明）。
          <Code>onSubmit</Code> 返回 Promise
          时确认按钮显示加载中，失败（reject）时对话框留着，由调用方提示原因，改完再提交。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, fieldApi]} />
  </DocPage>
));
