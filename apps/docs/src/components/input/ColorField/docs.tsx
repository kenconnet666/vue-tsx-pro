import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ColorFieldProps';
import swatchApi from 'virtual:api/ColorSwatchProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Brand from './demo/Brand.tsx?demo';
import Formats from './demo/Formats.tsx?demo';
import Tokens from './demo/Tokens.tsx?demo';

export const meta = {
  title: 'ColorField 颜色输入',
  description:
    '颜色输入：色块点开原生取色器，后面可以直接输入颜色值；ColorSwatch 列出一块颜色与它的名称、取值（调色板、设计 token）。',
  order: 10,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { ColorField, ColorSwatch } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="brand" title="品牌配色" demo={Brand}>
          值是 <Code>#rrggbb</Code>，绑定后随拖动实时写回。外观、Field 关联与 TextField 相同。
        </Example>
        <Example id="formats" title="格式与透明度" demo={Formats}>
          能输入任何 CSS 颜色，失焦或回车时规范成 #hex；写不成颜色时标为无效、值不变，失焦后恢复。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="swatch" title="ColorSwatch" demo={Tokens}>
          <Code>color</Code> 是颜色值或主题 token：token
          的取值按当前主题读出，换主题时跟着变（右上角切换主题试试）。半透明的颜色下面垫棋盘格。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, swatchApi]} />
  </DocPage>
));
