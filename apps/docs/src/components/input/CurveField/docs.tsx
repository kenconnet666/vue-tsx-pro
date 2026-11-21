import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Kbd } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/CurveFieldProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Lifetime from './demo/Lifetime.tsx?demo';

export const meta = {
  title: 'CurveField 曲线',
  description:
    '拖动关键帧编辑一条曲线：粒子随寿命的变化、缓动、包络。折线、平滑（单调三次）、阶梯三种插值，evaluateCurve 按同样的规则取值。',
  order: 11,
};

export default _component(() => () => (
  <DocPage
    meta={meta}
    imports="import { CurveField, evaluateCurve } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Example id="lifetime" title="大小随寿命" demo={Lifetime}>
      拖动关键帧改形状（左右不越过相邻的帧），空处双击加一帧，右键删一帧。<Code>_value</Code>{' '}
      拖动中实时写回，
      <Code>onValueCommit</Code> 在松手、按键、加删时调用一次，适合存盘或记进撤销。没给{' '}
      <Code>yMin</Code> / <Code>yMax</Code> 时纵轴按关键帧自动定，拖动期间冻住不跳。
    </Example>
    <KeyboardReference
      keys={[
        ['← / →', '挪横坐标（xStep，按住 Shift 十倍）'],
        ['↑ / ↓', '挪纵坐标（yStep，按住 Shift 十倍）'],
        ['Delete / Backspace', '删掉这一帧（至少留一帧）'],
        ['Insert', '在这一帧和下一帧中间加一帧'],
      ]}
    >
      关键帧按顺序各占一个 Tab 位置，读屏念它的坐标（<Code>valueText</Code> 可以改念法）。
      <Kbd>Tab</Kbd> 在帧之间走。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
