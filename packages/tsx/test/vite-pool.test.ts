// 编译线程池：结果与主线程编译一致；写错时的报错带着位置与代码帧回到主线程
import { afterAll, expect, it } from 'vitest';
import { compileModule, type CompilerSetup, type ModuleRequest } from '../src/vite/module';
import { CompilePool } from '../src/vite/pool';

const setup: CompilerSetup = {
  optimize: true,
  tokens: false,
  root: process.cwd(),
  stylex: { dev: false, importSources: ['@stylexjs/stylex'] },
  jsx: undefined,
  hmr: true,
};
const pool = new CompilePool(setup, 2);
afterAll(() => pool.close());

const request = (code: string): ModuleRequest => ({
  code,
  id: '/src/Counter.tsx',
  file: '/src/Counter.tsx',
  lang: 'tsx',
  own: true,
  ssr: false,
});

it('线程里的结果与主线程相同（符文、StyleX、JSX、热更新登记）', async () => {
  const code = `import * as stylex from '@stylexjs/stylex';
import { _component } from '@vue-tsx-pro/tsx';
const styles = stylex.create({ root: { color: 'red' } });
export const Counter = _component(({ step = 1 }: { step?: number }) => {
  let count = _state(0);
  return () => <button {...stylex.props(styles.root)} onClick={() => (count += step)}>{count}</button>;
});`;
  const [inWorker, inMain] = await Promise.all([
    pool.run(request(code)),
    compileModule(request(code), setup),
  ]);
  expect(inWorker).toEqual(inMain);
  expect(inWorker!.code).toContain('__VUE_HMR_RUNTIME__.createRecord');
  expect(inWorker!.stylex.length).toBeGreaterThan(0);
});

it('写错时的报错带着位置与代码帧', async () => {
  const error = (await pool
    .run(request('_component(() => { const n = _state({}); n = {}; return () => n; });'))
    .catch((caught: unknown) => caught)) as Error & { loc?: unknown };
  expect(error).toBeInstanceOf(Error);
  expect(error.message).toMatch(/const 声明/);
  expect(error.message).toContain('|'); // 代码帧
  expect(error.loc).toMatchObject({ start: { line: 1 } });
});
