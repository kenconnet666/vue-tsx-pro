/**
 * 释放 three.js 对象占用的 GPU 资源：几何体、材质、材质与 uniform 里的纹理。
 * three.js 不会随对象被垃圾回收而释放显存，移除模型、卸载场景时要显式调用。
 */
import type { Material, Object3D, Texture } from 'three';

function isTexture(value: unknown): value is Texture {
  return (value as Texture | null)?.isTexture === true;
}

/** 释放材质，连同它的贴图与 ShaderMaterial uniform 里的纹理 */
export function disposeMaterial(material: Material): void {
  for (const value of Object.values(material)) {
    if (isTexture(value)) value.dispose();
  }
  const uniforms = (material as { uniforms?: Record<string, { value: unknown }> }).uniforms;
  for (const uniform of Object.values(uniforms ?? {})) {
    if (isTexture(uniform.value)) uniform.value.dispose();
  }
  material.dispose();
}

/** 释放对象及其子孙的几何体、材质与纹理；场景的背景与环境贴图一并释放 */
export function disposeObject(root: Object3D): void {
  root.traverse((object) => {
    const { geometry, material } = object as Object3D & {
      geometry?: { dispose(): void };
      material?: Material | Material[];
    };
    geometry?.dispose();
    for (const item of [material ?? []].flat()) disposeMaterial(item);
  });
  const { background, environment } = root as Object3D & {
    background?: unknown;
    environment?: unknown;
  };
  if (isTexture(background)) background.dispose();
  if (isTexture(environment)) environment.dispose();
}
