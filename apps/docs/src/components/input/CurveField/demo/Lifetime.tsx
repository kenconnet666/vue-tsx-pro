// 粒子的大小随寿命：拖关键帧改形状，空处双击加一帧，右键删一帧；三种插值对比，下面是曲线上取的值
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  CurveField,
  evaluateCurve,
  Flex,
  Small,
  ToggleGroup,
  ToggleItem,
  type CurveKey,
} from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let keys = _state<readonly CurveKey[]>([
    { x: 0, y: 0.2 },
    { x: 0.3, y: 1 },
    { x: 1, y: 0 },
  ]);
  let interpolation = _state<'linear' | 'smooth' | 'step'>('smooth');
  let committed = _state(0);
  return () => (
    <Flex direction="column" gap="sm">
      <ToggleGroup _value={interpolation} required aria-label="插值">
        <ToggleItem value="linear">折线</ToggleItem>
        <ToggleItem value="smooth">平滑</ToggleItem>
        <ToggleItem value="step">阶梯</ToggleItem>
      </ToggleGroup>
      <CurveField
        _value={keys}
        interpolation={interpolation}
        yMin={0}
        yMax={1.2}
        aria-label="大小随寿命"
        onValueCommit={() => committed++}
      />
      <Small tone="muted">
        一半寿命时的大小 {evaluateCurve(keys, 0.5, interpolation).toFixed(2)}；提交了 {committed} 次
      </Small>
    </Flex>
  );
});
