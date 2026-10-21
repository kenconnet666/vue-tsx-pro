import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import fieldApi from 'virtual:api/FieldProps';
import api from 'virtual:api/FormProps';
import formValueApi from 'virtual:api/FormValueProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Native from './demo/Native.tsx?demo';
import Quote from './demo/Quote.tsx?demo';
import Signup from './demo/Signup.tsx?demo';
import States from './demo/States.tsx?demo';

export const meta = {
  title: 'Form 表单',
  description:
    'useForm 把值、校验、错误、提交状态放进一个控制器；Field 关联标签、说明与错误；一份 zod schema 同时给出校验、类型与字段约束。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { bigintSchema, decimalSchema, Field, Form, FormValue, useForm } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="signup" title="注册：校验与异步校验" demo={Signup}>
          错误“迟一点批评、早一点肯定”：字段失焦后才显示，提交过一次之后随输入实时更新；提交时没通过就把焦点移到第一个出错的控件。必填标记、maxlength、NumberField
          的范围都从 schema 推出来。
          <Code>fields.username.validate</Code> 是单字段的异步校验：防抖、只采用最后一次的结果，
          <Code>form.validating</Code> 显示校验中。
        </Example>
        <Example id="states" title="字段的状态" demo={States}>
          写在 <Code>Field</Code> 上的状态交给里面的控件（控件上显式写的优先）：
          <Code>required</Code> 在标签后加星号、控件带 aria-required；<Code>readonly</Code>、
          <Code>disabled</Code> 同步给控件。给了 <Code>error</Code> 就算出错，控件标红并经
          aria-describedby 关联错误信息；只写 <Code>invalid</Code> 时只标红。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="array" title="报价单：数组字段与 Decimal" demo={Quote}>
          <Code>form.array('items')</Code> 增删、插入、移动，每项有稳定的
          key，错误跟着下标走。金额用 <Code>decimalSchema({'{ min: 0, scale: 2 }'})</Code>：值是
          Decimal，NumberField 自动拿到 min 0、step 0.01，合计不受浮点误差影响。
        </Example>
        <Example id="native" title="原生提交" demo={Native}>
          不用 useForm 也可以：Select、NumberField、Slider、TagsInput 写了 <Code>name</Code>{' '}
          就带着隐藏的 input（FormValue），FormData 直接拿到；数字按规范的十进制文本提交（Decimal
          不丢精度），多值同名多个。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, fieldApi, formValueApi]} />
  </DocPage>
));
