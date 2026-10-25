import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Card,
  darkTheme,
  Flex,
  highContrastTheme,
  lightTheme,
  midnightTheme,
  paperTheme,
  Provider,
  ToggleGroup,
  ToggleItem,
} from '@vue-tsx-pro/ui';
import { ThreeCanvas } from '@vue-tsx-pro/ui/three';
import { colors } from '@vue-tsx-pro/ui/tokens';
import {
  AmbientLight,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
} from 'three';

const THEMES = {
  light: { label: '亮色', theme: lightTheme },
  dark: { label: '暗色', theme: darkTheme },
  paper: { label: '纸张', theme: paperTheme },
  midnight: { label: '午夜', theme: midnightTheme },
  contrast: { label: '高对比', theme: highContrastTheme },
};

const CHART = [
  colors.chart1,
  colors.chart2,
  colors.chart3,
  colors.chart4,
  colors.chart5,
  colors.chart6,
  colors.chart7,
  colors.chart8,
];

const styles = css.create({
  stage: { height: '22rem' },
  card: { backgroundColor: '_background', overflow: 'hidden' },
});

export default _component(() => {
  let name = _state<keyof typeof THEMES>('midnight');
  return () => (
    <Flex direction="column" gap="md">
      <ToggleGroup _value={_bind(name)} required aria-label="示例的主题">
        {Object.entries(THEMES).map(([value, item]) => (
          <ToggleItem key={value} value={value}>
            {item.label}
          </ToggleItem>
        ))}
      </ToggleGroup>
      <Provider theme={THEMES[name].theme}>
        <Card padding="none" sx={styles.card}>
          <ThreeCanvas
            sx={styles.stage}
            aria-label="八个按图表色板着色的小球绕着品牌色的球体旋转"
            setup={({ scene, themeColors }) => {
              const palette = themeColors({ accent: colors.accent, ring: colors.border });
              const core = new MeshStandardMaterial({ roughness: 0.25, emissiveIntensity: 0.35 });
              core.color = palette.accent;
              core.emissive = palette.accent;
              const ringMaterial = new MeshStandardMaterial({ roughness: 0.8 });
              ringMaterial.color = palette.ring;

              const orbit = new Group();
              const ball = new SphereGeometry(0.22, 32, 16);
              CHART.forEach((color, index) => {
                const material = new MeshStandardMaterial({ roughness: 0.35 });
                material.color = themeColors({ color }).color;
                const mesh = new Mesh(ball, material);
                const angle = (index / CHART.length) * Math.PI * 2;
                mesh.position.set(Math.cos(angle) * 1.7, Math.sin(angle) * 1.7, 0);
                orbit.add(mesh);
              });
              orbit.add(new Mesh(new TorusGeometry(1.7, 0.012, 8, 160), ringMaterial));
              orbit.rotation.x = -1.05;

              const light = new DirectionalLight(0xffffff, 2.2);
              light.position.set(2, 3, 4);
              scene.add(
                new Mesh(new SphereGeometry(0.75, 64, 32), core),
                orbit,
                new AmbientLight(0xffffff, 0.8),
                light,
              );
              return { frame: ({ time }) => void (orbit.rotation.z = time * 0.35) };
            }}
          />
        </Card>
      </Provider>
    </Flex>
  );
});
