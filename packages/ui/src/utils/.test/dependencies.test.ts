// 组件库依赖的工具库在本工具链（Vite + happy-dom）下能正常解析与使用；升级依赖时先看这里
import { expect, it } from 'vitest';
import { computePosition } from '@floating-ui/dom';
import { parseDate } from '@internationalized/date';
import { Check } from '@lucide/icons';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import Decimal from 'decimal.js';
import { animate, createDraggable, createLayout } from 'animejs';
import { tabbable } from 'tabbable';
import { z } from 'zod';

it('decimal.js：十进制精确运算', () => {
  expect(new Decimal('0.1').plus('0.2').toString()).toBe('0.3');
});

it('@internationalized/date：日历运算', () => {
  expect(parseDate('2026-02-28').add({ days: 1 }).toString()).toBe('2026-03-01');
});

it('@lucide/icons：按名导入图标数据', () => {
  expect(Check.node[0]![0]).toBe('path');
});

it('tabbable：找出可聚焦元素', () => {
  const root = document.createElement('div');
  root.innerHTML = '<button>a</button><span>b</span><input disabled /><a href="#">c</a>';
  expect(tabbable(root, { displayCheck: 'none' }).map((el) => el.tagName)).toEqual(['BUTTON', 'A']);
});

it('@floating-ui/dom：可以导入定位函数', () => {
  expect(computePosition).toBeTypeOf('function');
});

it('animejs：动画 JS 对象的数值（canvas、3D 场景用）；拖拽与布局动画可以导入', async () => {
  expect(createDraggable).toBeTypeOf('function');
  expect(createLayout).toBeTypeOf('function');
  const target = { x: 0 };
  await animate(target, { x: 100, duration: 50 });
  expect(target.x).toBe(100);
});

// 可选 peer 依赖：以后的图表、3D 组件用，组件库开发时安装
it('@unovis/ts、three：按需导入可以解析', async () => {
  const [{ XYContainer, Line }, { Scene, Vector3 }] = await Promise.all([
    import('@unovis/ts'),
    import('three'),
  ]);
  expect(XYContainer).toBeTypeOf('function');
  expect(Line).toBeTypeOf('function');
  expect(new Scene().children).toEqual([]);
  expect(new Vector3(3, 4, 0).length()).toBe(5);
});

it('zod 实现 Standard Schema，表单只依赖接口', async () => {
  const schema: StandardSchemaV1<unknown, string> = z.string().min(2);
  const result = await schema['~standard'].validate('x');
  expect(result.issues?.length).toBe(1);
});

// 可选 peer 依赖：路由适配（子路径 @vue-tsx-pro/ui/vue-router）与以后需要共享状态的组件
it('vue-router、pinia：按需导入可以解析', async () => {
  const [{ createRouter, createMemoryHistory }, { createPinia, defineStore }] = await Promise.all([
    import('vue-router'),
    import('pinia'),
  ]);
  const router = createRouter({ history: createMemoryHistory(), routes: [] });
  expect(typeof router.push).toBe('function');
  expect(typeof createPinia().install).toBe('function');
  expect(defineStore).toBeTypeOf('function');
});
