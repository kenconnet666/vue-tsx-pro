import { _component } from '@vue-tsx-pro/tsx';
import { Code, Link } from '@vue-tsx-pro/ui';
import api from 'virtual:api/CascaderProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Category from './demo/Category.tsx?demo';
import Lazy from './demo/Lazy.tsx?demo';
import Region from './demo/Region.tsx?demo';

export const meta = {
  title: 'Cascader 级联选择',
  description:
    '一列一列往下选（省 / 市 / 区、产品大类 / 小类），触发框里显示整条路径。要在一棵树里勾选多个用 TreeSelect。',
  order: 6,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Cascader } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="region" title="省市区" demo={Region}>
          数据形状不限，<Code>getKey</Code>、<Code>getLabel</Code>、<Code>getChildren</Code>{' '}
          读出层级（同 <Link href="/components/tree-select">TreeSelect</Link>）。<Code>_value</Code>{' '}
          是从第一级到选中节点的 key 路径，key
          只要在同级里唯一。默认只能选到叶子，点有下一级的项只是展开。
          <Code>searchable</Code> 时输入就换成一列匹配的完整路径（按已加载的节点，认拼音）；
          <Code>showAllLevels</Code> 关掉时只显示最后一级。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="change-on-select" title="选到任意一级" demo={Category}>
          <Code>changeOnSelect</Code> 时点任何一级都选中它（弹出层不关，可以继续往下选），
          <Code>isDisabled</Code> 的项不能选也不能进入，<Code>separator</Code> 换路径分隔。
        </Example>
        <Example id="lazy" title="按级取回" demo={Lazy}>
          <Code>hasChildren</Code> 声明有下一级，进入时 <Code>loadChildren</Code>{' '}
          取回来放进数据里（数据要是响应式的），期间那一列显示转圈、带
          aria-busy。编辑页把已选的那一枝放进初始数据（随表单返回），触发框一开始就显示得出文字；没放的级按
          key 显示，打开时沿着已选的路径逐级取回来。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['↓ / Enter / Space', '关闭时：打开，焦点到已选的那一列（可搜索时在搜索框里）'],
        ['↓ / ↑ / Home / End', '在一列里移动；有下一级的项跟着显示下一列'],
        ['→', '进入下一级（懒加载的先取回来）；从右到左排版时是 ←'],
        ['←', '回到上一级；从右到左排版时是 →'],
        ['Enter', '选中高亮的项：叶子选中后关闭；changeOnSelect 时有下一级的也选中并进入下一级'],
        ['Esc / Tab', '关闭，焦点回到触发按钮'],
      ]}
    >
      每一级是一列 listbox（名称是上一级的文字），焦点在列上，高亮项经 aria-activedescendant
      告诉读屏。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
