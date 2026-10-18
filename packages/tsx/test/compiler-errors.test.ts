import { describe, it, expect } from 'vitest';
import { compileRunes } from '../src/compiler/index';

const cases: [string, string, RegExp][] = [
  ['导出会被整体替换的状态', 'export let x = _state(0)', /不能导出会被整体替换的响应式变量 x/],
  ['export { x }', 'let x = _state(0); export { x }', /不能导出响应式变量 x/],
  ['写入 _derived', 'let a = _state(1); const d = _derived(a * 2); d = 3', /只读/],
  [
    '写入解构出的 _derived',
    'let p = _state({ x: 1 }); const { x } = _derived(p); x = 2',
    /x 来自 _derived，是只读的/,
  ],
  ['const 原始值状态', 'const x = _state(0)', /const 声明的原始值无法修改/],
  [
    'const 对象状态整体替换',
    'const form = _state({ a: 1 }); form = { a: 2 }',
    /用 const 声明，不能整体替换/,
  ],
  [
    'watch 直接传响应式变量',
    "import { watch } from 'vue'; let form = _state({ a: 1 }); watch(form, () => {})",
    /watch\(\(\) => form, …\)/,
  ],
  [
    'watch 数组源里直接传响应式变量',
    "import { watch } from 'vue'; let a = _state(0); watch([a], () => {})",
    /监听源请写成 getter/,
  ],
  ['_state.snapshot 多个参数', 'let a = _state({}); _state.snapshot(a, a)', /只接受一个参数/],
  ['_effect 当作值使用', 'const stop = _effect(() => {})', /没有返回值，请单独写成一条语句/],
  [
    '渲染函数里写 _effect',
    '_component(() => () => { _effect(() => {}); return null })',
    /_effect 写在渲染函数里/,
  ],
  ['_effect 多个参数', '_effect(() => {}, 1)', /只接受一个参数/],
  ['_state 解构声明', 'let { a } = _state({ a: 1 })', /不能解构声明/],
  ['符文当作值传递', 'const make = _state', /只能按约定的位置直接调用/],
  ['_toRef 参数不是响应式变量', 'const r = _toRef(1)', /_toRef\(x\) 的参数必须是/],
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
    expect(out).toContain('<input type="number" v-model_number={form.value.age} />');
  });

  it('export const 对象状态导出 ref 里的对象本身（reactive），文件内其他状态仍是 ref', async () => {
    const out = (await compileRunes('export const settings = _state({ a: 1 }); let n = _state(0)'))!
      .code;
    expect(out).toContain('export const settings = _vue_reactive({');
    expect(out).toContain('let n = _vue_ref(0)');
  });

  it('let 声明的 _derived 可以临时覆盖；const 仍是 computed', async () => {
    const code = 'let a = _state(1); let d = _derived(a * 2); const e = _derived(a); d = 5';
    const out = (await compileRunes(code))!.code;
    expect(out).toContain('let d = _vtp_overridable(() => a.value * 2)');
    expect(out).toContain('const e = _vue_computed(() => a.value)');
    expect(out).toContain('d.value = 5');
  });

  it('普通 prop 可以写入（组件本地覆盖），_bind 也可以绑定它', async () => {
    const code =
      '_component(({ v = 1 }: any) => { const reset = () => (v = 1); return () => <X v={_bind(v)} onReset={reset} /> })';
    const out = (await compileRunes(code))!.code;
    expect(out).toContain('v.value = 1');
    expect(out).toContain('v-model:v={v.value}');
  });

  it('watch 的监听源写成 getter 或 _toRef(x)', async () => {
    const code = [
      "import { watch } from 'vue';",
      'let n = _state(0);',
      'watch(() => n, () => {}); watch(_toRef(n), () => {});',
    ].join('\n');
    const out = (await compileRunes(code))!.code;
    expect(out).toContain('watch(() => n.value, () => {})');
    expect(out).toContain('watch(n, () => {})');
  });

  it('_state.snapshot(x) 编译为运行时的 snapshot(x.value)', async () => {
    const out = (await compileRunes(
      'let form = _state({ a: 1 }); const copy = _state.snapshot(form)',
    ))!.code;
    expect(out).toContain('const copy = _vtp_snapshot(form.value)');
  });

  it('_effect / _effect.pre / _effect.root 编译为运行时函数，里面的读取改写为 .value', async () => {
    const code = [
      'let n = _state(0);',
      '_effect(() => console.log(n));',
      '_effect.pre(() => console.log(n));',
      'const stop = _effect.root(() => {});',
    ].join('\n');
    const out = (await compileRunes(code))!.code;
    expect(out).toContain('_vtp_effect(() => console.log(n.value));');
    expect(out).toContain('_vtp_effect(() => console.log(n.value), "pre");');
    expect(out).toContain('const stop = _vtp_effectRoot(() => {});');
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

  it('渲染函数、回调、_derived 与 _toRef 里读取不警告', async () => {
    const code = [
      '_component(({ size = 1 }: { size?: number }) => {',
      '  let count = _state(0);',
      '  const doubled = _derived(count * size);',
      '  const log = () => console.log(size);',
      '  watch(_toRef(count), log);',
      '  return () => [size, doubled];',
      '})',
    ].join('\n');
    expect((await compileRunes(code))!.warnings).toEqual([]);
  });

  it('_untrack(x)：有意只取当前值，不警告；编译成 untrack(() => …)', async () => {
    const code = [
      '_component(({ open = false }: { open?: boolean }) => {',
      '  let collapsed = _state(_untrack(!open));',
      '  return () => collapsed;',
      '})',
    ].join('\n');
    const result = (await compileRunes(code))!;
    expect(result.warnings).toEqual([]);
    expect(result.code).toContain('_vtp_untrack(() => !open.value)');
  });
});

describe('组件名', () => {
  it('export default 取文件名；index 文件取目录名', async () => {
    const code = 'export default _component(() => () => null)';
    expect((await compileRunes(code, 'src/Badge.tsx'))!.code).toContain('name: "Badge"');
    expect((await compileRunes(code, 'src/Select/index.tsx'))!.code).toContain('name: "Select"');
  });
});
