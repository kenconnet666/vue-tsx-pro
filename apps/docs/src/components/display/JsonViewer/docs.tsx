import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Link } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/JsonViewerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Paste from './demo/Paste.tsx?demo';
import Response from './demo/Response.tsx?demo';

export const meta = {
  title: 'JsonViewer JSON 查看器',
  description:
    '看接口返回、日志、配置、导入的原始数据：展开收起的键值树，值按类型着色，可以搜索，选中一项复制它的值与路径。',
  order: 9,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { JsonViewer } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="response" title="接口返回" demo={Response}>
          <Code>value</Code>
          {
            ' 是 JSON.parse 的结果或任意值：对象、数组、Map、Set 可以展开，收起时显示项数；bigint 与 Decimal 这类自带 toString 的数字对象照实显示（不丢精度），Date 显示 ISO，循环引用显示 [Circular]。'
          }
          <Code>expandDepth</Code>
          {' 是一开始展开几层（默认 1）。点一项（或用方向键移过去按 Enter）后，下方显示它的路径（'}
          <Code>$.data.items[0].sku</Code>，不是标识符的键写成 <Code>["delivery-window"]</Code>
          {'），可以复制路径与值；对象、数组复制成缩进两格的 JSON。'}
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="paste" title="粘贴 JSON 与大数据" demo={Paste}>
          建在 <Link href="/components/tree">Tree</Link>
          {
            ' 上：只渲染看得见的行，五千条也流畅；子节点展开到哪一层才建哪一层。搜索框按键名与值过滤，留下匹配的项与它们的祖先，匹配的加粗；“全部展开”会展开全部的对象与数组。'
          }
          <Code>toolbar={'{false}'}</Code> 去掉顶部的搜索与按钮，<Code>maxHeight</Code>{' '}
          是超出后滚动的高度（默认 24rem）。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['↓ / ↑', '移动到下一项、上一项'],
        ['→ / ←', '展开、进入第一个子项 / 收起、回到父项'],
        ['Home / End', '第一项、最后一项'],
        ['Enter', '选中当前项，路径栏显示它的路径与复制按钮'],
        ['字母键', '跳到下一个以它开头的项'],
      ]}
    >
      键值树是 role="tree"，层级、位置经 aria-level、aria-posinset
      告诉读屏；路径栏的两个复制按钮名称是“复制路径”“复制值”。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
