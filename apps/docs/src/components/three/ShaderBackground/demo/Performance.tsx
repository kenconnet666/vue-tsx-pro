// 所有 3D 效果共有：画质档位、渲染分辨率、暂停；quality="off" 时不创建 WebGL，显示 fallback（没有 WebGL 时也是它）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Field,
  Flex,
  Grid,
  Slider,
  Switch,
  ToggleGroup,
  ToggleItem,
  t,
} from '@zerodep-dev/vue-tsx-pro-ui';
import {
  AuroraBackground,
  MeshGradient,
  ParticleField,
  WaveGrid,
  type EffectProps,
  type ThreeQuality,
} from '@zerodep-dev/vue-tsx-pro-ui/three';

type Effect = 'mesh' | 'aurora' | 'particles' | 'wave';

const styles = css.create({
  stage: { height: '16rem', borderRadius: '_lg', backgroundColor: '_surfaceMuted' },
  // 静态的替代画面：同样的色调，一层 CSS 渐变
  fallback: {
    height: '100%',
    backgroundImage: `linear-gradient(120deg, ${t.colors.accent}, ${t.colors.chart5} 55%, ${t.colors.chart6})`,
    opacity: 0.6,
  },
});

export default _component(() => {
  let effect = _state<Effect>('mesh');
  let quality = _state<ThreeQuality>('auto');
  let resolution = _state(0.5);
  let paused = _state(false);
  return () => {
    const props: EffectProps = {
      sx: styles.stage,
      quality,
      resolution,
      paused,
      fallback: <div {...css.attrs(styles.fallback)} />,
    };
    return (
      <Flex direction="column" gap="md">
        <Field label="效果">
          <ToggleGroup _value={effect} required>
            <ToggleItem value="mesh">网格渐变</ToggleItem>
            <ToggleItem value="aurora">极光</ToggleItem>
            <ToggleItem value="particles">粒子场</ToggleItem>
            <ToggleItem value="wave">线框地形</ToggleItem>
          </ToggleGroup>
        </Field>
        <Grid minItemWidth="12rem" gap="lg" align="end">
          <Field label="画质">
            <ToggleGroup _value={quality} required>
              <ToggleItem value="auto">自动</ToggleItem>
              <ToggleItem value="low">低</ToggleItem>
              <ToggleItem value="high">高</ToggleItem>
              <ToggleItem value="off">关</ToggleItem>
            </ToggleGroup>
          </Field>
          <Field label="渲染分辨率">
            <Slider
              _value={resolution}
              min={0.1}
              max={1}
              step={0.05}
              valueText={(value) => `${Math.round(value * 100)}%`}
            />
          </Field>
          <Switch _checked={paused}>暂停</Switch>
        </Grid>
        {effect === 'mesh' && <MeshGradient {...props} />}
        {effect === 'aurora' && <AuroraBackground {...props} />}
        {effect === 'particles' && <ParticleField {...props} links />}
        {effect === 'wave' && <WaveGrid {...props} />}
      </Flex>
    );
  };
});
