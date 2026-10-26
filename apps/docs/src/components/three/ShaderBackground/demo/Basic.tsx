import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { ShaderBackground } from '@zerodep-dev/vue-tsx-pro-ui/three';

// 等离子：几组正弦叠加，按结果在主题色板里取色；uTime、uResolution、themePalette 都是自动提供的
const PLASMA = /* glsl */ `
vec4 shade(vec2 uv) {
  vec2 p = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 3.0;
  float t = uTime * 0.6;
  float v = sin(p.x + t) + sin(p.y * 1.3 - t) + sin(length(p) * 2.0 - t * 1.5)
    + sin(p.x * 0.7 + p.y * 0.9 + t * 0.7);
  return vec4(themePalette(v * 0.125 + 0.5), 1.0);
}
`;

const styles = css.create({ stage: { height: '18rem', borderRadius: '_lg' } });

export default _component(() => () => (
  <ShaderBackground sx={styles.stage} fragmentShader={PLASMA} />
));
