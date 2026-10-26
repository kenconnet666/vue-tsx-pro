import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import fieldApi from 'virtual:api/FieldProps';
import api from 'virtual:api/FormProps';
import formValueApi from 'virtual:api/FormValueProps';
import summaryApi from 'virtual:api/FormErrorSummaryProps';
import labelApi from 'virtual:api/LabelProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Admission from './demo/Admission.tsx?demo';
import Layout from './demo/Layout.tsx?demo';
import Native from './demo/Native.tsx?demo';
import Quote from './demo/Quote.tsx?demo';
import Signup from './demo/Signup.tsx?demo';
import Wizard from './demo/Wizard.tsx?demo';
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
    imports="import { bigintSchema, decimalSchema, Field, Form, FormErrorSummary, FormValue, useForm, useLeaveConfirmation } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Example id="admission" title="供应商准入：自动绑定与错误汇总" demo={Admission}>
      <Code>form.Field</Code> 里只有一个控件、控件上没写值时，自动绑定 <Code>form.values</Code>{' '}
      的这个字段（同 Ant Design Form.Item 的 name）：写回 <Code>_value</Code>，声明了{' '}
      <Code>_checked</Code> 而没有 _value 的控件（Switch、单个 Checkbox）写回 _checked，也可以用{' '}
      <Code>valueProp</Code> 指定；自己写了 <Code>_value</Code> 的照旧。
      <Code>FormErrorSummary</Code>{' '}
      放在表单顶上：提交没通过时列出显示着的错误（按字段在表单里的顺序、带字段名），焦点先到它上面，点哪一项跳到那个字段，改对一项就少一项（GOV.UK
      的 Error summary）。跨字段的规则写在 schema 的 <Code>refine</Code> 里，<Code>path</Code>{' '}
      指到要标错的字段；<Code>dependencies</Code> 让开始日期改了之后结束日期跟着重新校验。
    </Example>
    <Examples>
      <ExampleColumn>
        <Example id="signup" title="注册：校验与异步校验" demo={Signup}>
          错误“迟一点批评、早一点肯定”：字段失焦后才显示，提交过一次之后随输入实时更新；提交时没通过就把焦点移到第一个出错的控件。必填标记、maxlength、NumberField
          的范围都从 schema 推出来。
          <Code>fields.username.validate</Code> 是单字段的异步校验：防抖、只采用最后一次的结果，
          <Code>form.validating</Code>{' '}
          显示校验中。空值的约定：文本框清空是空字符串；选择、数字、日期控件没有值时是{' '}
          <Code>null</Code>，选填的字段在 schema 里写 <Code>.nullable()</Code>
          （字段约束据此不标必填）。schema 没写提示时，错误跟随当前语言：该填的没填是“必填”（
          <Code>lang.formRequired</Code>），其余取 zod 自带的语言包（<Code>lang.formIssues</Code>
          ）。<Code>{'useLeaveConfirmation(() => form.dirty)'}</Code>
          在有未保存的改动时拦住离开：关掉、刷新标签页由浏览器问；站内跳转（Provider 配了
          vueRouterAdapter）弹确认对话框，只换 query、锚点不问。填几个字后点顶栏的站名试试。
        </Example>
        <Example id="layout" title="标签在左侧、整组只读" demo={Layout}>
          <Code>labelPlacement="start"</Code> 把标签放到控件的起始边：标签一列（
          <Code>labelWidth</Code>，默认
          8em）贴着控件右对齐，控件一列；两列按第一行文字的基线对齐，单选组、多行文本框也对得齐。写在{' '}
          <Code>Form</Code> 上的布局与 <Code>readonly</Code>、<Code>disabled</Code>{' '}
          交给所有字段与控件：只读时勾选、开关、滑块、分段控件照常显示与聚焦，读屏念“只读”，点了不变。Field
          与控件上显式写的优先。
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
        <Example id="wizard" title="分步填写：局部校验与字段联动" demo={Wizard}>
          <Code>{"form.validate(['company', 'contact', 'phone'])"}</Code>{' '}
          只校验这一步的字段（含子路径），立即显示它们的错误，返回是否通过，通过才进下一步；别的步骤的错误不打扰。
          <Code>{"dependencies: { confirm: ['password'] }"}</Code>
          ：改了密码重新校验“确认密码”，改了预算下限重新校验上限；被依赖的字段填过或失焦过时才提示，没填过的不打扰。字段的单字段异步校验也跟着依赖重跑。这一套拼好的是页面组合里的{' '}
          <Code>StepsForm</Code>（步骤条、上一步 / 下一步、提交失败跳回出错的步骤）。
        </Example>
        <Example id="native" title="原生提交" demo={Native}>
          不用 useForm 也可以：Select、NumberField、Slider、TagsInput 写了 <Code>name</Code>{' '}
          就带着隐藏的 input（FormValue），FormData 直接拿到；数字按规范的十进制文本提交（Decimal
          不丢精度），多值同名多个。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, summaryApi, fieldApi, formValueApi, labelApi]} />
  </DocPage>
));
