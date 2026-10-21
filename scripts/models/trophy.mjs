/**
 * 生成文档站 ModelViewer 示例用的模型（apps/docs/public/models/trophy.glb）：一座奖杯，
 * 金属的杯身、把手、杯脚，石质的底座；全部由 three 的几何体拼成，没有贴图，用 GLTFExporter 导出成 GLB。
 * 改了造型时重跑：pnpm gen:trophy
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { requireFrom, root } from '../lib/repo.mjs';

const fromDocs = requireFrom('apps/docs');
// 用 ES 模块版：GLTFExporter 里 import 的 three 也是它，instanceof 才对得上
// three 的 exports 不含 package.json：从主入口（build/three.cjs）往上一层就是包目录
const threeDir = dirname(dirname(fromDocs.resolve('three')));
const load = (path) => import(pathToFileURL(join(threeDir, path)).href);
const THREE = await load('build/three.module.js');
const { GLTFExporter } = await load('examples/jsm/exporters/GLTFExporter.js');

// GLTFExporter 用浏览器的 FileReader 读 Blob：Node 里补一个只有这两个方法的版本
globalThis.FileReader = class {
  result = null;
  onloadend = null;
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
  async readAsDataURL(blob) {
    const base64 = Buffer.from(await blob.arrayBuffer()).toString('base64');
    this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
    this.onloadend?.();
  }
};

const gold = new THREE.MeshStandardMaterial({
  name: 'Gold',
  color: 0xe2b04a,
  metalness: 1,
  roughness: 0.28,
});
const stone = new THREE.MeshStandardMaterial({
  name: 'Stone',
  color: 0x2b2f36,
  metalness: 0.1,
  roughness: 0.55,
});
const plate = new THREE.MeshStandardMaterial({
  name: 'Plate',
  color: 0xd9dde3,
  metalness: 1,
  roughness: 0.2,
});

const trophy = new THREE.Group();
trophy.name = 'Trophy';

// 杯身、杯颈、杯脚：一条轮廓线绕 y 轴旋转（单位米，奖杯高约 0.36）
const profile = [
  [0.0, 0.09],
  [0.045, 0.09],
  [0.05, 0.1],
  [0.018, 0.115],
  [0.014, 0.15],
  [0.02, 0.165],
  [0.06, 0.19],
  [0.085, 0.24],
  [0.095, 0.3],
  [0.1, 0.34],
  [0.105, 0.35],
  [0.092, 0.35],
  [0.086, 0.3],
  [0.0, 0.3],
].map(([x, y]) => new THREE.Vector2(x, y));
const cup = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), gold);
cup.name = 'Cup';
trophy.add(cup);

// 两侧的把手：半个圆环
for (const side of [-1, 1]) {
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 16, 48, Math.PI), gold);
  handle.name = side < 0 ? 'HandleLeft' : 'HandleRight';
  handle.position.set(side * 0.09, 0.27, 0);
  handle.rotation.z = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  trophy.add(handle);
}

// 底座：两层石台，正面一块铭牌
const base = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.16), stone);
base.name = 'Base';
base.position.y = 0.025;
const top = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.12), stone);
top.name = 'BaseTop';
top.position.y = 0.07;
const label = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.004), plate);
label.name = 'Plate';
label.position.set(0, 0.026, 0.081);
trophy.add(base, top, label);

const scene = new THREE.Scene();
scene.add(trophy);
const glb = await new GLTFExporter().parseAsync(scene, { binary: true });
const out = join(root, 'apps/docs/public/models/trophy.glb');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, Buffer.from(glb));
console.log(`已生成 ${out}（${(glb.byteLength / 1024).toFixed(1)} KB）`);
