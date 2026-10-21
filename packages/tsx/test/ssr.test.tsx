// @vitest-environment node
// 服务端渲染：_effect、_effect.pre 都不执行（同 Svelte 的 $effect），渲染照常
import { expect, it } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { _component } from '../src';

it('服务端渲染时 _effect 与 _effect.pre 都不执行', async () => {
  const runs: string[] = [];
  const App = _component(() => {
    let count = _state(1);
    _effect.pre(() => void runs.push(`pre ${count}`));
    _effect(() => void runs.push(`post ${count}`));
    return () => <p>{count}</p>;
  });
  expect(await renderToString(createSSRApp(App))).toBe('<p>1</p>');
  expect(runs).toEqual([]);
});
