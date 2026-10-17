import { describe, it, expect } from 'vitest';
import { compileRunes } from '../src/compiler/index';

const cases: [string, string, RegExp][] = [
  ['导出会重新赋值的状态', 'export let x = _state(0)', /不能直接导出响应式变量 x/],
  ['export { x }', 'let x = _state(0); export { x }', /不能导出响应式变量 x/],
  ['写入 _derived', 'let a = _state(1); const d = _derived(a * 2); d = 3', /只读/],
  [
    '写入普通 prop',
    '_component(({ disabled = false }) => { let n = _state(0); disabled = true; return () => n })',
    /prop disabled 是只读的/,
  ],
  ['const 原始值状态', 'const x = _state(0)', /const 声明的 _state 只能是对象或数组字面量/],
  ['解构声明', 'let { a } = _state({ a: 1 })', /不能解构声明/],
  ['符文当作值传递', 'const make = _state', /只能按约定的位置直接调用/],
  ['_ref 参数不是响应式变量', 'const r = _ref(1)', /_ref\(x\) 的参数必须是/],
  ['var 声明', 'var x = _state(0)', /let 或 const/],
  [
    '组件外使用 _bindable',
    'function f({ a = _bindable(1) }) {}',
    /只能写在组件参数解构的默认值位置/,
  ],
  ['不存在的成员', 'let x = _state.deep(0)', /不支持 _state.deep/],
  [
    '渲染函数里声明 _state（return 形式）',
    '_component(() => { return () => { let n = _state(0); return n } })',
    /写在渲染函数里/,
  ],
  [
    '渲染函数里声明 _derived（箭头简写、嵌套回调）',
    '_component(() => () => [1].map(() => { const d = _derived(1); return d }))',
    /写在渲染函数里/,
  ],
  [
    'vue-jsx 会丢弃的默认值：负数',
    '_component(({ index = -1 }) => () => index)',
    /index 的默认值会被 vue-jsx 丢弃/,
  ],
  [
    'vue-jsx 会丢弃的默认值：函数调用',
    '_component(({ items = makeItems() }) => () => items)',
    /默认值会被 vue-jsx 丢弃/,
  ],
  [
    'vue-jsx 会丢弃的默认值：模板字符串',
    '_component(({ label = `x` }) => () => label)',
    /默认值会被 vue-jsx 丢弃/,
  ],
];

describe('误用在编译期报错', () => {
  for (const [name, code, message] of cases) {
    it(name, async () => {
      await expect(compileRunes(code)).rejects.toThrow(message);
    });
  }

  it('vue-jsx 支持的默认值照常通过', async () => {
    const code = [
      'const DEFAULT_INDEX = -1;',
      '_component(({ a = 1, b = "x", c = true, d = null, e = {}, f = [], g = () => 1,',
      '  h = DEFAULT_INDEX, i = undefined as string | undefined, j = 0!, k = _bindable(false) }: any) => {',
      '  let n = _state(0);',
      '  return () => [a, b, c, d, e, f, g, h, i, j, k, n];',
      '});',
    ].join('\n');
    await expect(compileRunes(code)).resolves.toBeTruthy();
  });

  it('setup 函数体与 setup 内的普通回调可以声明符文', async () => {
    const code =
      '_component(() => { let n = _state(0); const inc = () => { const d = _derived(n + 1); return d }; return () => [n, inc] })';
    await expect(compileRunes(code)).resolves.toBeTruthy();
  });

  it('被本地变量遮蔽的同名函数不当作符文', async () => {
    const out = await compileRunes('const _state = (v: number) => v; let x = _state(1); x = 2');
    expect(out!.code).not.toContain('.value');
  });
});
