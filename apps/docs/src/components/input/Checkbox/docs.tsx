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
import { KeyboardReference } from '../../../site/KeyboardReference';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Items from './demo/Items.tsx?demo';
import Permissions from './demo/Permissions.tsx?demo';
import Settings from './demo/Settings.tsx?demo';
import Shipping from './demo/Shipping.tsx?demo';
import Validation from './demo/Validation.tsx?demo';

export const meta = {
  title: 'Checkbox 复选、单选与开关',
  description:
    '选择：多选的 Checkbox 与 CheckboxGroup、单选的 Radio 与 RadioGroup、立即生效的 Switch。都是原生 input，键盘与读屏行为由浏览器保证。',
  order: 4,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Checkbox, CheckboxGroup, Radio, RadioGroup, Switch } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="checkbox" title="复选框" demo={Permissions}>
          单个复选框绑 <Code>_checked</Code>；一组用 CheckboxGroup 绑值的数组，<Code>name</Code>{' '}
          随表单提交。全选框部分勾选时写 <Code>indeterminate</Code>，读屏念“部分选中”。放进 Field
          时组以标签为名称，并关联说明与错误。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="switch" title="开关" demo={Settings}>
          Switch 是立即生效的设置（需要提交才生效的用 Checkbox）。切换要等接口时写{' '}
          <Code>loading</Code>：滑块里转圈、点击无效，配合 <Code>onUpdate:_checked</Code>{' '}
          在接口回来后再改值。轨道里可以放图标或文字，对读屏隐藏。
        </Example>
        <Example id="radio" title="单选" demo={Shipping}>
          同一组的原生 radio 共用 <Code>name</Code>：Tab
          只停在选中项，方向键在组内移动并选中，都是浏览器的原生行为。选项里可以放任意内容（说明、价格）；
          <Code>orientation="horizontal"</Code> 横排。
        </Example>
        <Example id="validation" title="必选与出错" demo={Validation}>
          提交时才检查：Field 的 <Code>required</Code> 标出必填，<Code>error</Code>{' '}
          让整组标红并把错误作为说明念出；单个复选框（同意条款）同样包在 Field 里显示错误。
          <Code>orientation="horizontal"</Code> 让一组横排。
        </Example>
        <Example id="items" title="选项来自数据" demo={Items}>
          <Code>CheckboxGroup</Code>、<Code>RadioGroup</Code> 的 <Code>items</Code> 同
          Select：ListboxOption（值、文字、说明、不可用）、字符串，或任意数据加{' '}
          <Code>toOption</Code>
          ，选项来自字典、接口时不用一个个写。<Code>description</Code> 显示在文字下方，经
          aria-describedby 关联；单独的 <Code>Checkbox</Code>、<Code>Radio</Code> 也能写。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['Space', '复选框、开关：切换勾选'],
        [
          '↓ / → / ↑ / ←',
          '单选组里：移到下一个 / 上一个选项并选中（原生 radio，整组一个 Tab 位置）',
        ],
        ['Tab', '复选框、开关各占一个 Tab 位置；单选组只停在已选（或第一个）选项上'],
      ]}
    >
      都是原生的 input，键盘与读屏行为来自浏览器；样式自己画。
    </KeyboardReference>
    <ApiReference api={[api, groupApi, radioApi, radioGroupApi, switchApi]} />
  </DocPage>
));
