import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { ThreeCanvas, usePointer } from '@vue-tsx-pro/ui/three';
import { colors } from '@vue-tsx-pro/ui/tokens.stylex';
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
} from 'three';

const COLUMNS = 18;
const ROWS = 9;
const GAP = 0.36;

const styles = stylex.create({ stage: { height: '20rem', cursor: 'crosshair' } });

export default _component(() => {
  let host = _state.raw<HTMLElement | null>(null);
  // 指针位置（-1 到 1），弹簧阻尼；离开区域时 strength 淡出到 0
  const pointer = usePointer(() => host);
  return () => (
    <div ref={_toRef(host)}>
      <ThreeCanvas
        sx={styles.stage}
        setup={({ scene, camera, themeColors }) => {
          const palette = themeColors({ low: colors.chart2, high: colors.accent });
          const material = new MeshStandardMaterial({ roughness: 0.4 });
          const cubes = new InstancedMesh(
            new BoxGeometry(0.28, 0.28, 0.28),
            material,
            COLUMNS * ROWS,
          );
          const dummy = new Object3D();
          const tint = new Color();
          camera.position.set(0, -3.4, 6.2);
          camera.lookAt(0, 0, 0);
          const light = new DirectionalLight(0xffffff, 2);
          light.position.set(-2, -3, 5);
          scene.add(cubes, new AmbientLight(0xffffff, 0.8), light);
          return {
            frame: ({ time }) => {
              // 指针在网格平面上的位置
              const px = pointer.x * (COLUMNS * GAP) * 0.5;
              const py = pointer.y * (ROWS * GAP) * 0.5;
              for (let row = 0; row < ROWS; row++) {
                for (let column = 0; column < COLUMNS; column++) {
                  const index = row * COLUMNS + column;
                  const x = (column - (COLUMNS - 1) / 2) * GAP;
                  const y = (row - (ROWS - 1) / 2) * GAP;
                  const near = Math.exp(-((x - px) ** 2 + (y - py) ** 2) * 1.6) * pointer.strength;
                  const wave = Math.sin(time * 1.4 + x * 1.2 + y * 0.8) * 0.5 + 0.5;
                  const height = 0.15 + wave * 0.25 + near * 1.6;
                  dummy.position.set(x, y, height * 0.14);
                  dummy.scale.set(1, 1, 0.4 + height * 2);
                  dummy.updateMatrix();
                  cubes.setMatrixAt(index, dummy.matrix);
                  cubes.setColorAt(
                    index,
                    tint.lerpColors(palette.low, palette.high, Math.min(1, near + wave * 0.3)),
                  );
                }
              }
              cubes.instanceMatrix.needsUpdate = true;
              cubes.instanceColor!.needsUpdate = true;
            },
          };
        }}
      />
    </div>
  );
});
