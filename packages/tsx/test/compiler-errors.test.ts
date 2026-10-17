import { describe, it, expect } from 'vitest';
import { compileRunes } from '../src/compiler/index';

const cases: [string, string, RegExp][] = [
  ['导出会重新赋值的状态', 'export let x = _state(0)', /不能直接导出响应式变量 x/],
  ['export { x }', 'let x = _state(0); export { x }', /不能导出响应式变量 x/],
  ['写入 _derived', 'let a = _state(1); const d = _derived(a * 2); d = 3', /只读/],
  [
    '写入解构出的 _derived',
    'let p = _state({ x: 1 }); const { x } = _derived(p); x = 2',
    /x 来自 _derived，是只读的/,
  ],
  [
    '写入普通 prop',
    '_component(({ disabled = false }) => { let n = _state(0); disabled = true; return () => n })',
    /prop disabled 是只读的/,
  ],
  ['const 原始值状态', 'const x = _state(0)', /const 声明的 _state 只能是对象或数组字面量/],
  ['_state 解构声明', 'let { a } = _state({ a: 1 })', /不能解构声明/],
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
  [
    '组件函数体里直接读取 children',
    '_component(({ children }: any) => { const content = children; return () => content })',
    /children 是父级传入的内容/,
  ],
  [
    '_bind 只读的 _derived',
    'let a = _state(1); const d = _derived(a); <X v={_bind(d)} />',
    /d 来自 _derived，是只读的，不能用 _bind/,
  ],
  [
    '_bind 普通 prop',
    '_component(({ v = 1 }: any) => () => <X v={_bind(v)} />)',
    /prop v 是只读的/,
  ],
  ['_bind 非响应式变量', 'let n = 1; <X v={_bind(n)} />', /_bind 的参数必须是/],
  ['_bind 不在 JSX 属性里', 'let n = _state(1); const r = _bind(n)', /只能写在 JSX 属性的值里/],
  [
    '_bind 原生元素绑定其他属性',
    'let n = _state(""); <input title={_bind(n)} />',
    /只能绑定 value 或 checked/,
  ],
  [
    '_bind 修饰符用在组件上',
    'let n = _state(""); <X v={_bind.trim(n)} />',
    /修饰符只用于原生输入元素/,
  ],
  [
    '_bind 未知修饰符',
    'let n = _state(""); <input value={_bind.upper(n)} />',
    /不支持 _bind.upper/,
  ],
  ['v-model 指令', 'let n = _state(""); <input v-model={n} />', /属性=\{_bind\(x\)\}/],
  ['v-model:prop 指令', 'let n = _state(false); <X v-model:checked={n} />', /属性=\{_bind\(x\)\}/],
  ['v-show 指令', 'let n = _state(true); <i v-show={n} />', /hidden=\{!visible\}/],
  ['v-slots 指令', 'let n = _state(1); <X v-slots={{}} />', /没有插槽/],
  ['自定义指令', 'let n = _state(1); <i v-focus={n} />', /不支持 Vue 指令 v-focus/],
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

  it('children 可以在回调里读取；作为组件子节点时改写为 unref 以便原样转交', async () => {
    const code = [
      '_component(({ children }: any) => {',
      '  const has = () => children != null;',
      '  return () => <Box>{children}</Box>;',
      '})',
    ].join('\n');
    const out = (await compileRunes(code))!.code;
    expect(out).toContain('children.value != null');
    expect(out).toContain('<Box>{_vue_unref(children)}</Box>');
  });

  it('_bind 编译为 v-model：组件带参数名，原生元素带修饰符', async () => {
    const code = [
      'let on = _state(false); let name = _state(""); const form = _state({ age: 1 });',
      '<>',
      '  <Switch checked={_bind(on)} />',
      '  <input value={_bind.lazy.trim(name)} />',
      '  <input type="number" value={_bind.number(form.age)} />',
      '</>',
    ].join('\n');
    const out = (await compileRunes(code))!.code;
    expect(out).toContain('<Switch v-model:checked={on.value} />');
    expect(out).toContain('<input v-model_lazy_trim={name.value} />');
    expect(out).toContain('<input type="number" v-model_number={form.age} />');
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

describe('编译警告', () => {
  it('组件函数体里直接读取 prop 或符文：只拿到当前值，给出警告', async () => {
    const code = [
      '_component(({ size = 1 }: { size?: number }) => {',
      '  let count = _state(0);',
      '  const first = size + count;',
      '  return () => first;',
      '})',
    ].join('\n');
    const { warnings } = (await compileRunes(code))!;
    expect(warnings.map((w) => w.message.split(' ')[0])).toEqual(['size', 'count']);
    expect(warnings[0]!.loc!.start.line).toBe(3);
  });

  it('渲染函数、回调、_derived 与 _ref 里读取不警告', async () => {
    const code = [
      '_component(({ size = 1 }: { size?: number }) => {',
      '  let count = _state(0);',
      '  const doubled = _derived(count * size);',
      '  const log = () => console.log(size);',
      '  watch(_ref(count), log);',
      '  return () => [size, doubled];',
      '})',
    ].join('\n');
    expect((await compileRunes(code))!.warnings).toEqual([]);
  });
});

describe('组件名', () => {
  it('export default 取文件名；index 文件取目录名', async () => {
    const code = 'export default _component(() => () => null)';
    expect((await compileRunes(code, 'src/Badge.tsx'))!.code).toContain('name: "Badge"');
    expect((await compileRunes(code, 'src/Select/index.tsx'))!.code).toContain('name: "Select"');
  });
});
