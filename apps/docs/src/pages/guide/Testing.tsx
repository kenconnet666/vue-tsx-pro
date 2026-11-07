/** 指南：测试。在自己的测试里驱动组件库的复合控件：/testing 子路径的 harness */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, CodeBlock, H2, List, ListItem, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';
import { DocPage } from '../../site/DocPage';

const meta = {
  title: 'Testing 测试',
  description:
    'Select、Cascader、日期、Tree、DataTable 不是原生控件，测试里按用户的操作驱动它们：/testing 子路径的 harness，按名称找控件、等渲染完再返回。',
};

const setup = `// vitest.config.ts：environment 用 happy-dom 或 jsdom，或浏览器模式
// test/setup.ts
import { setupTestingDom } from '@zerodep-dev/vue-tsx-pro-ui/testing';

// 补上 popover、scrollIntoView、ResizeObserver；不排版的环境里给元素一个视口大小（虚拟滚动才有行）
setupTestingDom({ viewport: { width: 1024, height: 600 } });`;

const example = `import { mount } from '@vue/test-utils';
import {
  cascaderHarness,
  dataTableHarness,
  datePickerHarness,
  getControl,
  selectHarness,
  settle,
} from '@zerodep-dev/vue-tsx-pro-ui/testing';
import OrderForm from './OrderForm';

it('填好采购单并提交', async () => {
  const root = mount(OrderForm, { attachTo: document.body }).element;
  await settle();

  await selectHarness(getControl(root, '供应商')).choose('华东钢铁');
  await cascaderHarness(getControl(root, '收货地区')).choose('浙江省', '杭州市', '西湖区');
  await datePickerHarness(getControl(root, '交货日期')).pick('2026-11-07');

  const lines = dataTableHarness(getControl(root, '明细'));
  expect(lines.rows()).toEqual([['钢板', '12', '¥ 4,800.00']]);
  await lines.sort('数量');
  expect(lines.sortOf('数量')).toBe('ascending');
});`;

const harnesses: [string, string][] = [
  ['selectHarness', 'open、close、options()、choose(...文字)（多选给几项）、search(文字)、text()'],
  ['cascaderHarness', 'choose(...路径)一级一级点下去、columns() 每一列的选项、text()'],
  ['treeSelectHarness', 'choose(...路径)展开到最后一级并点它、tree() 拿到树的 harness'],
  [
    'treeHarness',
    'labels() 看得见的节点、expand / collapse、click（选中、勾选或展开）、check、selected()、checked()',
  ],
  [
    'dateFieldHarness / datePickerHarness',
    "fill('2026-11-07')、fill('2026-11-07T14:30')、pick 同 fill、clear()、text()；DatePicker 还有 open()",
  ],
  [
    'dataTableHarness',
    'headers()、rows() 各行各格的文字、cell(行, 列)、sort(列标题)、sortOf(列标题)、selectRow(第几行)',
  ],
];

export default _component(() => () => (
  <DocPage meta={meta}>
    <Paragraph>
      {'测试自己的页面时，复合控件（下拉、级联、日期、树、表格）不能像原生 '}
      <Code>{'<select>'}</Code>
      {' 那样直接改值。'}
      <Code>@zerodep-dev/vue-tsx-pro-ui/testing</Code>
      {
        ' 按用户的操作驱动它们（同 Angular CDK 的 component harness）：只认读屏用的语义（role、aria-*）与部件标记（data-part），组件内部的结构、样式改了，测试不用跟着改。'
      }
    </Paragraph>
    <H2 id="setup" size="xl" anchor>
      准备
    </H2>
    <CodeBlock title="test/setup.ts" code={setup} lang="ts" />
    <H2 id="usage" size="xl" anchor>
      写法
    </H2>
    <Paragraph>
      <Code>getControl(容器, 名称)</Code>
      {
        ' 按标签文字找控件（Field 的标签、aria-label、aria-labelledby；找不到时报出容器里有哪些名称），交给对应的 harness；方法都等渲染完才返回。挂载后先 '
      }
      <Code>await settle()</Code>
      {'：虚拟滚动的树、表格在第一次测量后才有行。'}
    </Paragraph>
    <CodeBlock title="OrderForm.test.ts" code={example} lang="ts" />
    <H2 id="harnesses" size="xl" anchor>
      有哪些
    </H2>
    <List>
      {harnesses.map(([name, text]) => (
        <ListItem key={name}>
          <Code>{name}</Code>
          {`：${text}`}
        </ListItem>
      ))}
    </List>
    <Paragraph>
      {'底层的 '}
      <Code>click</Code>、<Code>press</Code>、<Code>typeText</Code>、<Code>settle</Code>
      {' 也导出了，自己写别的控件的驱动时用。'}
    </Paragraph>
  </DocPage>
));
