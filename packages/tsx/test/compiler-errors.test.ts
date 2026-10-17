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
    /只能写在 _component 参数解构的默认值位置/,
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
  ['props 参数不解构', '_component((props: { a?: number }) => () => props.a)', /请解构 props/],
  ['props 嵌套解构', '_component(({ user: { name } }: any) => () => name)', /props 不支持嵌套解构/],
];

describe('误用在编译期报错', () => {
  for (const [name, code, message] of cases) {
    it(name, async () => {
      await expect(compileRunes(code)).rejects.toThrow(message);
    });
  }

  it('props 默认值可以是任意表达式，并在实例内按书写顺序求值', async () => {
    const code = [
      "_component(({ size = 'md', icon = pick(size), index = -1, label = `#${index}`, items = [] }: any) =>",
      '  () => [size, icon, index, label, items])',
    ].join('\n');
    const out = (await compileRunes(code))!.code;
    // 默认值变成惰性函数，引用的前一个 prop 已改写为 .value
    expect(out).toContain('_vtp_prop(_props, "icon", () => pick(size.value))');
    expect(out).toContain('_vtp_prop(_props, "index", () => -1)');
    // 自动补上组件的 props 声明
    expect(out).toMatch(/props: \["size", "icon", "index", "label", "items"\]/);
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

describe('按文件类型解析', () => {
  it('.ts 不开 JSX：类型断言与泛型箭头函数照常解析', async () => {
    const code = 'let n = _state(0); const a = <number>(n as unknown); const id = <T>(x: T) => x;';
    const out = (await compileRunes(code, 'store.ts'))!.code;
    expect(out).toContain('<number> n.value as unknown');
    expect(out).toContain('<T,>(x: T) => x');
  });

  it('没有符文与 _component 的文件原样放过', async () => {
    await expect(
      compileRunes('export const C = defineComponent(() => () => null)'),
    ).resolves.toBeNull();
  });
});
