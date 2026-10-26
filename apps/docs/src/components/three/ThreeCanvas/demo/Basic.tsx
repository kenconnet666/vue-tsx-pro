import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { ThreeCanvas } from '@zerodep-dev/vue-tsx-pro-ui/three';
import { colors } from '@zerodep-dev/vue-tsx-pro-ui/tokens';
import {
  AmbientLight,
  DirectionalLight,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  TorusKnotGeometry,
  WireframeGeometry,
} from 'three';

const styles = css.create({ stage: { height: '20rem' } });

export default _component(() => () => (
  <ThreeCanvas
    sx={styles.stage}
    aria-label="缓慢旋转的环面结，颜色取主题的品牌色"
    setup={({ scene, themeColors }) => {
      const palette = themeColors({
        accent: colors.accent,
        glow: colors.chart3,
        line: colors.borderStrong,
      });
      const knotMaterial = new MeshStandardMaterial({ roughness: 0.3, metalness: 0.25 });
      // 直接赋主题色对象：换主题时原地过渡，不用重建材质
      knotMaterial.color = palette.accent;
      knotMaterial.emissive = palette.glow;
      knotMaterial.emissiveIntensity = 0.2;
      const knot = new Mesh(new TorusKnotGeometry(0.9, 0.3, 240, 32), knotMaterial);

      const shellMaterial = new LineBasicMaterial({ transparent: true, opacity: 0.4 });
      shellMaterial.color = palette.line;
      const shell = new LineSegments(
        new WireframeGeometry(new IcosahedronGeometry(1.75, 1)),
        shellMaterial,
      );

      const key = new DirectionalLight(0xffffff, 2.4);
      key.position.set(3, 4, 5);
      scene.add(knot, shell, new AmbientLight(0xffffff, 0.7), key);
      return {
        frame: ({ time }) => {
          knot.rotation.set(time * 0.3, time * 0.45, 0);
          shell.rotation.set(time * 0.05, -time * 0.12, 0);
        },
      };
    }}
  />
));
