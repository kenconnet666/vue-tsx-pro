import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/GradientFieldProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Lifetime from './demo/Lifetime.tsx?demo';

export const meta = {
  title: 'GradientField 渐变',
  description:
    '编辑一条颜色渐变：拖动色标、双击加色标、选中的改颜色（带透明度）和位置。sampleGradient 取某一点的颜色，gradientCss 写成 CSS。',
  order: 12,
};

export default _component(() => () => (
  <DocPage
    meta={meta}
    imports="import { GradientField, sampleGradient, gradientCss } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Example id="lifetime" title="颜色随寿命" demo={Lifetime}>
      颜色是 <Code>#rrggbb</Code> 或 <Code>#rrggbbaa</Code>
      {
        '，透明的地方露出棋盘格。拖动色标改位置（越过别的色标时重新排序），双击渐变条加一个色标（颜色取渐变在那一点的颜色）。'
      }
      <Code>onValueCommit</Code>
      {' 在一次操作结束时调用。'}
    </Example>
    <KeyboardReference
      keys={[
        ['← / →', '挪位置（step，按住 Shift 十倍）'],
        ['Home / End', '挪到两端'],
        ['Delete / Backspace', '删掉这个色标（至少留一个）'],
        ['Insert', '在它和下一个色标中间加一个'],
      ]}
    >
      色标是 role="slider"，读屏念位置和颜色；聚焦的色标就是下面正在编辑的那个。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
