import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import groupApi from 'virtual:api/CheckboxGroupProps';
import api from 'virtual:api/CheckboxProps';
import radioGroupApi from 'virtual:api/RadioGroupProps';
import radioApi from 'virtual:api/RadioProps';
import switchApi from 'virtual:api/SwitchProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Permissions from './demo/Permissions.tsx?demo';
import Settings from './demo/Settings.tsx?demo';
import Shipping from './demo/Shipping.tsx?demo';

export const meta = {
  title: 'Checkbox、Radio 与 Switch',
  description:
    '选择：多选的 Checkbox 与 CheckboxGroup、单选的 Radio 与 RadioGroup、立即生效的 Switch。都是原生 input，键盘与读屏行为由浏览器保证。',
  order: 2,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Checkbox, CheckboxGroup, Radio, RadioGroup, Switch } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <Example id="checkbox" title="复选框" demo={Permissions}>
        单个复选框绑 <Code>checked</Code>；一组用 CheckboxGroup 绑值的数组，<Code>name</Code>{' '}
        随表单提交。全选框部分勾选时写 <Code>indeterminate</Code>，读屏念“部分选中”。放进 Field
        时组以标签为名称，并关联说明与错误。
      </Example>
      <Example id="switch" title="开关" demo={Settings}>
        Switch 是立即生效的设置（需要提交才生效的用 Checkbox）。切换要等接口时写{' '}
        <Code>loading</Code>：滑块里转圈、点击无效，配合 <Code>_bind(get, set)</Code>{' '}
        在接口回来后再写回。轨道里可以放图标或文字，对读屏隐藏。
      </Example>
      <Example id="radio" title="单选" demo={Shipping}>
        同一组的原生 radio 共用 <Code>name</Code>：Tab
        只停在选中项，方向键在组内移动并选中，都是浏览器的原生行为。选项里可以放任意内容（说明、价格）；
        <Code>orientation="horizontal"</Code> 横排。
      </Example>
    </Examples>
    <ApiReference api={[api, groupApi, radioApi, radioGroupApi, switchApi]} />
  </DocPage>
));
