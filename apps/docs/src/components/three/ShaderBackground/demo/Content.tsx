// 叠加内容（children）、色板、时间流速与指针：内容照常排版、可以交互，画布在它下面
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Badge,
  Button,
  Field,
  Flex,
  Grid,
  H2,
  Paragraph,
  Slider,
  Switch,
  ToggleGroup,
  ToggleItem,
} from '@vue-tsx-pro/ui';
import { SHADER_PALETTE, ShaderBackground } from '@vue-tsx-pro/ui/three';
import { colors } from '@vue-tsx-pro/ui/tokens';

// 缓慢流动的色带：按噪声在色板里取色，指针附近提亮
const FLOW = /* glsl */ `
vec4 shade(vec2 uv) {
  vec2 p = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  float n = fbm(vec3(p * 1.8, uTime * 0.08)) * 0.5 + 0.5;
  vec3 color = themePalette(clamp(n + uv.x * 0.25 - 0.1, 0.0, 1.0));
  float glow = uPointer.z * smoothstep(0.7, 0.0, distance(uv * 2.0 - 1.0, uPointer.xy));
  return vec4(mix(uBackground, color, 0.45 + glow * 0.35), 1.0);
}
`;

const PALETTES = {
  default: SHADER_PALETTE,
  sunset: [colors.chart3, colors.chart4, colors.chart8],
  ocean: [colors.chart2, colors.chart6, colors.accent],
};

const styles = css.create({
  hero: { minHeight: '20rem', borderRadius: '_lg', display: 'grid', placeItems: 'center' },
  content: { maxWidth: '28rem', padding: '_xl', textAlign: 'center' },
  lead: { color: '_textMuted' },
});

export default _component(() => {
  let palette = _state<keyof typeof PALETTES>('default');
  let speed = _state(1);
  let interactive = _state(true);
  return () => (
    <Flex direction="column" gap="md">
      <Grid minItemWidth="12rem" gap="lg" align="end">
        <Field label="色板">
          <ToggleGroup _value={_bind(palette)} required>
            <ToggleItem value="default">默认</ToggleItem>
            <ToggleItem value="sunset">晚霞</ToggleItem>
            <ToggleItem value="ocean">海洋</ToggleItem>
          </ToggleGroup>
        </Field>
        <Field label="时间流速">
          <Slider _value={_bind(speed)} min={0} max={4} step={0.1} />
        </Field>
        <Switch _checked={_bind(interactive)}>跟随指针</Switch>
      </Grid>
      <ShaderBackground
        sx={styles.hero}
        fragmentShader={FLOW}
        palette={PALETTES[palette]}
        speed={speed}
        interactive={interactive}
        propsContent={{ sx: styles.content }}
      >
        <Flex direction="column" gap="md" align="center">
          <Badge variant="soft">限时活动</Badge>
          <H2 size="xl">秋季发布会</H2>
          <Paragraph sx={styles.lead}>
            文字与按钮叠在着色器上面，照常排版、可以点击；画布不接收指针，也不进入读屏。
          </Paragraph>
          <Button>预约直播</Button>
        </Flex>
      </ShaderBackground>
    </Flex>
  );
});
