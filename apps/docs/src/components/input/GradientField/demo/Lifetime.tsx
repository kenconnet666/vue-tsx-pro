// 粒子的颜色随寿命：拖色标改位置，双击渐变条加一个色标，选中的在下面改颜色（带透明度）和位置；下面是渐变在中间的颜色
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Flex,
  GradientField,
  sampleGradient,
  Small,
  type GradientStop,
} from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let stops = _state<readonly GradientStop[]>([
    { offset: 0, color: '#ffe680ff' },
    { offset: 0.5, color: '#ff661aff' },
    { offset: 1, color: '#33333300' },
  ]);
  return () => (
    <Flex direction="column" gap="sm">
      <GradientField _value={stops} aria-label="颜色随寿命" />
      <Small tone="muted">一半寿命时的颜色 {sampleGradient(stops, 0.5)}</Small>
    </Flex>
  );
});
