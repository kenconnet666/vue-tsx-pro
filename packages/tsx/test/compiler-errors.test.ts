import { describe, it, expect } from 'vitest';
import { compileRunes } from '../src/compiler/index';

const cases: [string, string, RegExp][] = [
  ['导出会被整体替换的状态', 'export let x = _state(0)', /不能导出会被整体替换的响应式变量 x/],
  ['export { x }', 'let x = _state(0); export { x }', /不能导出响应式变量 x/],
  [
    'export default x（导出的是当时的值）',
    'let x = _state(0); export default x',
    /不能导出响应式变量 x/,
  ],
  ['写入 _derived', 'let a = _state(1); const d = _derived(a * 2); d = 3', /只读/],
  [
    '_derived 里修改状态',
    'let a = _state(1); let n = _state(0); const d = _derived(a * 2 + n++)',
    /不能在 _derived 里修改 n/,
  ],
  [
    '_derived.by 里修改状态',
    'let a = _state(1); let last = _state(0); const d = _derived.by(() => { last = a; return a * 2; })',
    /不能在 _derived 里修改 last/,
  ],
  [
    '_untrack 的参数写成函数',
    'let a = _state(1); const b = _untrack(() => a)',
    /_untrack 的参数就是要读的值/,
  ],
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
    '旧写法 _bind(x)',
    'let n = _state(1); <X _v={_bind(n)} />',
    /不用再写 _bind：.*直接写 _value=\{x\}/,
  ],
  [
    '旧写法 _bind(get, set)',
    'let n = _state(1); <X _v={_bind(() => n, (v) => {})} />',
    /不再需要 _bind\(get, set\)：写成 _value=\{取值\} onUpdate:_value/,
  ],
  [
    '修饰符写在没有下划线的属性上',
    'let n = _state(""); <input value={_bind.trim(n)} />',
    /可双向绑定的属性以下划线开头：写成 _value=/,
  ],
  [
    '原生元素的下划线属性只给值',
    'let n = _state(""); <input _value="a" />',
    /原生元素的 _value 用于双向绑定，值要是可写的变量或对象属性/,
  ],
  ['原生元素的下划线属性的值不可写', 'let n = 1; <input _value={n} />', /只给值时写 value=\{…\}/],
  [
    '_bindable 的 prop 名没有下划线',
    '_component(({ v = _bindable(1) }) => () => v)',
    /可双向绑定的 prop 以下划线开头：写成 { _v: v = _bindable/,
  ],
  [
    '下划线开头的 prop 没用 _bindable',
    '_component(({ _v: v = 1 }) => () => v)',
    /下划线开头的 prop 留给可双向绑定的值/,
  ],
  [
    '_bindable 的本地变量带下划线',
    '_component(({ _v = _bindable(1) }) => () => _v)',
    /本地变量不用下划线开头（留给符文）：写成 { _v: v = _bindable/,
  ],
  [
    '_bind 修饰符不在 JSX 属性里',
    'let n = _state(""); const r = _bind.trim(n)',
    /只能写在 JSX 属性的值里/,
  ],
  [
    '原生元素绑定其他属性',
    'let n = _state(""); <input _title={n} />',
    /原生元素能绑定 _value、_checked/,
  ],
  [
    '_bind 修饰符用在组件上',
    'let n = _state(""); <X _v={_bind.trim(n)} />',
    /修饰符只用于原生输入元素/,
  ],
  [
    '_bind 未知修饰符',
    'let n = _state(""); <input _value={_bind.upper(n)} />',
    /不支持 _bind.upper/,
  ],
  ['v-model 指令', 'let n = _state(""); <input v-model={n} />', /双向绑定直接写下划线属性/],
  [
    'v-model:prop 指令',
    'let n = _state(false); <X v-model:checked={n} />',
    /双向绑定直接写下划线属性/,
  ],
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
    // 默认值变成惰性函数，引用的前一个 prop 已改写为 .value；字面量直接传值；都没被写过，用只读访问器
    expect(out).toContain('_vtp_readonlyProp(_props, "icon", () => pick(size.value))');
    expect(out).toContain('_vtp_readonlyProp(_props, "index", -1)');
    expect(out).not.toContain('_vtp_prop');
    // 自动补上组件的 props 声明
    expect(out).toMatch(/props: \["size", "icon", "index", "label", "items"\]/);
  });

  it('被写过、或交给 _toRef 的 prop 仍用可覆盖的访问器；交给下划线属性的普通 prop 只传值', async () => {
    const code = [
      '_component(({ a = 1, b = 2, c = 3, d = 4 }: any) => {',
      '  const bump = () => a++;',
      '  useThing(_toRef(b));',
      '  return () => [<Input _value={c} />, d, bump];',
      '})',
    ].join('\n');
    const out = (await compileRunes(code))!.code;
    for (const name of ['a', 'b']) expect(out).toContain(`_vtp_prop(_props, "${name}"`);
    for (const name of ['c', 'd']) expect(out).toContain(`_vtp_readonlyProp(_props, "${name}"`);
    expect(out).not.toContain('onUpdate:_value');
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
    const plain = (await compileRunes(code, 'input.tsx', { optimize: false }))!.code;
    expect(plain).toContain('children.value != null');
    expect(plain).toContain('<Box>{_vue_unref(children)}</Box>');
    // 渲染优化打开时：原样转交，稳不稳定跟着上层（运行时判断）
    const optimized = (await compileRunes(code))!.code;
    expect(optimized).toContain('<Box>{_vtp_forwardChildren(_props)}</Box>');
  });

  it('可写的值自动双向绑定：组件写出值与 onUpdate 回调，原生元素编译为 v-model（type="number" 自动按数字）', async () => {
    const code = [
      'let on = _state(false); let name = _state(""); const form = _state({ age: 1 });',
      '<>',
      '  <Switch _checked={on} />',
      '  <input _value={_bind.lazy.trim(name)} />',
      '  <input type="number" _value={form.age} />',
      '</>',
    ].join('\n');
    const out = (await compileRunes(code, 'input.tsx', { optimize: false }))!.code;
    expect(out).toContain(
      '<Switch _checked={on.value} onUpdate:_checked={$event => on.value = $event} />',
    );
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

  it('普通 prop 可以写入（组件本地覆盖）；交给下划线属性时只传值，往下绑定要声明成 _bindable', async () => {
    const code =
      '_component(({ v = 1, _w: w = _bindable(2) }: any) => { const reset = () => (v = 1); return () => [<X _v={v} onReset={reset} />, <X _v={w} />] })';
    const out = (await compileRunes(code, 'input.tsx', { optimize: false }))!.code;
    expect(out).toContain('v.value = 1');
    expect(out).toContain('<X _v={v.value} onReset={reset} />');
    expect(out).toContain('<X _v={w.value} onUpdate:_v={$event => w.value = $event} />');
  });

  it('只传值：表达式、const 派生；写了 onUpdate:_x 时由它处理，不再自动写回', async () => {
    const code = [
      'let n = _state(1); const d = _derived(n * 2); let on = _state(false);',
      '<>',
      '  <X _v={n + 1} />',
      '  <X _v={d} />',
      '  <Switch _checked={on} onUpdate:_checked={save} />',
      '</>',
    ].join('\n');
    const out = (await compileRunes(code, 'input.tsx', { optimize: false }))!.code;
    expect(out).toContain('<X _v={n.value + 1} />');
    expect(out).toContain('<X _v={d.value} />');
    expect(out).toContain('<Switch _checked={on.value} onUpdate:_checked={save} />');
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

  it('const 的状态（对象读到的就是那个响应式对象）、函数体里的 n++ 不警告', async () => {
    const code = [
      '_component(() => {',
      "  const form = _state({ name: '' });",
      '  register(form);',
      '  let count = _state(0);',
      '  count++;',
      '  return () => count;',
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

  it('只用到 _untrack 的文件（组合式函数）也要编译，不然运行时找不到它', async () => {
    const result = await compileRunes('export const read = (source) => _untrack(source.value);');
    expect(result?.code).toContain('_vtp_untrack(() => source.value)');
  });
});

describe('组件名', () => {
  it('export default 取文件名；index 文件取目录名', async () => {
    const code = 'export default _component(() => () => null)';
    expect((await compileRunes(code, 'src/Badge.tsx'))!.code).toContain('name: "Badge"');
    expect((await compileRunes(code, 'src/Select/index.tsx'))!.code).toContain('name: "Select"');
  });
});
