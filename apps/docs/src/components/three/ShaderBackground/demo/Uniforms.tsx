import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Flex, Slider, Text } from '@vue-tsx-pro/ui';
import { ShaderBackground } from '@vue-tsx-pro/ui/three';

// 同心圆环从指针处荡开：uRings 是自己加的 uniform，uPointer 自动提供（z 是指针在区域内的程度）
const RIPPLES = /* glsl */ `
uniform float uRings;

vec4 shade(vec2 uv) {
  float aspect = uResolution.x / uResolution.y;
  vec2 center = mix(vec2(0.0), uPointer.xy, uPointer.z) * 0.5;
  float d = distance((uv - 0.5) * vec2(aspect, 1.0), center * vec2(aspect, 1.0));
  float wave = sin(d * uRings * 6.2832 - uTime * 2.0) * 0.5 + 0.5;
  float n = fbm(vec3(uv * 2.0, uTime * 0.1)) * 0.15;
  vec3 color = themePalette(clamp(wave * 0.8 + n + d * 0.3, 0.0, 1.0));
  // 边缘渐隐到透明，透出页面底色
  float alpha = 1.0 - smoothstep(0.35, 0.9, d);
  return vec4(color, alpha);
}
`;

const styles = css.create({
  stage: { height: '18rem' },
  label: { color: '_textMuted' },
  slider: { flexGrow: 1, maxWidth: '20rem' },
});

export default _component(() => {
  let rings = _state(6);
  const uniforms = { uRings: { value: 6 } };
  _effect(() => void (uniforms.uRings.value = rings));
  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="sm" align="center">
        <Text size="sm" sx={styles.label}>
          圆环数 {rings}
        </Text>
        <Slider
          _value={_bind(rings)}
          min={1}
          max={20}
          aria-label="圆环数"
          propsRoot={{ sx: styles.slider }}
        />
      </Flex>
      <ShaderBackground sx={styles.stage} fragmentShader={RIPPLES} uniforms={uniforms} />
    </Flex>
  );
});
