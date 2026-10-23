// 渲染优化（compiler/optimize.ts）：哪些子节点标 $stable、哪些属性值缓存，以及运行时的效果与正确性
import { afterEach, describe, expect, it } from 'vitest';
import { createApp, nextTick, reactive, type VNodeChild } from 'vue';
import { _component } from '../src';
import { compileRunes } from '../src/compiler';

const compile = async (code: string) => (await compileRunes(code))!.code;
/** 包成组件：render 是渲染函数的返回值，setup 是 return 之前的语句 */
const component = (setup: string, render: string) =>
  `_component(({ title, children, ...rest }: any) => { ${setup}; return () => { const local = 1; return ${render}; }; })`;

describe('哪些子节点标 $stable', () => {
  it.each([
    ['文字与组件', '<Box><Btn label="a" />保存</Box>'],
    ['符文', '<Box>{n}</Box>'],
    ['prop', '<Box>{title}</Box>'],
    ['setup 里的函数与组合式函数的结果', '<Box>{format(lang.code)}</Box>'],
    ['模块里的常量', '<Box>{MAX}</Box>'],
    ['内容自己的回调参数', '<Box>{items.map((item) => <i>{item}</i>)}</Box>'],
  ])('%s → 稳定', async (_, render) => {
    const out = await compile(
      `const MAX = 3; ${component('let n = _state(0); const items = _derived([1]); const lang = useLang(); const format = (x) => x', render)}`,
    );
    expect(out).toContain('$stable: true');
  });

  it.each([
    ['渲染里的变量', '<Box>{local}</Box>'],
    ['map 的参数', '<>{[1].map((i) => <Box>{i}</Box>)}</>'],
    ['会被重新赋值的普通 let', '<Box>{plain}</Box>'],
    ['字面量初始化的 const（可能被直接改）', '<Box>{list}</Box>'],
    ['...rest（attrs 不是响应式的）', '<Box>{rest.title}</Box>'],
    ['as 断言的字面量（[] as T[] 一样可能被直接改）', '<Box>{typed.length}</Box>'],
  ])('%s → 保持原样', async (_, render) => {
    const out = await compile(
      component(
        'let plain = 0; const bump = () => plain++; const list: number[] = []; const typed = [] as number[]',
        render,
      ),
    );
    expect(out).not.toContain('$stable');
  });

  it('子节点是绑定到函数的变量：当作渲染函数交出；导入的标识符看不出来，保持运行时判断', async () => {
    const fn = await compile(
      component('const renderRow = (row: number) => <i>{row}</i>', '<List>{renderRow}</List>'),
    );
    expect(fn).toMatch(/default: renderRow,\s*\$stable: true/);
    const imported = await compile(
      `import { label } from './x'; ${component('', '<Box>{label}</Box>')}`,
    );
    expect(imported).not.toContain('$stable');
  });

  it('原样转交 children 交给 forwardChildren，夹着别的内容时稳不稳定由运行时判断', async () => {
    expect(await compile(component('', '<Box>{children}</Box>'))).toContain(
      '<Box>{_vtp_forwardChildren(_props)}</Box>',
    );
    expect(await compile(component('', '<Box><b>{title}</b>{children}</Box>'))).toContain(
      '$stable: _vtp_childrenStable()',
    );
  });

  it('函数子节点作为渲染函数原样交出', async () => {
    const out = await compile(component('', '<List>{(row: number) => <i>{row}</i>}</List>'));
    expect(out).toMatch(/default: \(row: number\) => <i>\{row\}<\/i>,\s*\$stable: true/);
  });

  it('标了 $stable 的组件按位置加 key；回调、循环里的与写了 key 的不加', async () => {
    const out = await compile(
      component(
        'const rows = [1]',
        `<div>
          <Box>a</Box>
          <Box key="mine">b</Box>
          {rows.map(() => <Box>c</Box>)}
        </div>`,
      ),
    );
    expect(out.match(/key="__site\d+"/g)).toHaveLength(1);
    expect(out).toContain('key="mine"');
  });

  it('Teleport、KeepAlive 与原生元素的子节点不动；关掉优化时都不动', async () => {
    const code = `import { Teleport } from 'vue'; ${component('', '<div><Teleport to="body"><b>x</b></Teleport><p>y</p></div>')}`;
    expect(await compile(code)).not.toContain('$stable');
    const plain = await compileRunes(component('', '<Box>x</Box>'), 'input.tsx', {
      optimize: false,
    });
    expect(plain!.code).not.toContain('$stable');
  });
});

describe('哪些属性值缓存', () => {
  it('只用到实例内不变值的函数缓存；用到渲染里的变量不缓存', async () => {
    const out = await compile(
      component(
        'let n = _state(0)',
        '<><Btn onPress={() => n++} /><Btn onPress={() => local} />{[1].map((i) => <Btn onPress={() => i} />)}</>',
      ),
    );
    expect(out).toContain('onPress={_cache[0] || (_cache[0] = () => n.value++)}');
    expect(out).toContain('onPress={() => local}');
    expect(out).toContain('onPress={() => i}');
    expect(out).toMatch(/const _cache = \[\];/);
  });

  it('数组、对象只在直接读的都是常量时缓存：读符文的值、有调用的不缓存', async () => {
    const out = await compile(
      `const styles = { a: 1, b: 2 }; ${component(
        'let on = _state(false)',
        '<><Box sx={[styles.a, styles.b]} /><Box sx={[styles.a, on && styles.b]} /><Box sx={[pick(styles.a)]} /></>',
      )}`,
    );
    expect(out).toContain('sx={_cache[0] || (_cache[0] = [styles.a, styles.b])}');
    expect(out).toContain('sx={[styles.a, on.value && styles.b]}');
    expect(out).toContain('sx={[pick(styles.a)]}');
  });

  it('常量里面的东西可能会变：组合式函数的结果、导入的对象，读成员与展开都不缓存；样式表、命名空间导入的一层例外', async () => {
    const out = await compile(
      `import * as stylex from '@vue-tsx-pro/tsx/stylex'; import * as icons from './icons'; import { settings } from './store';
      const styles = stylex.create({ a: { color: 'red' } });
      ${component(
        'const store = useStore()',
        '<><Probe style={{ color: store.color }} /><Probe items={[...store.items]} /><Probe flag={[settings.dark]} /><Probe sx={[styles.a]} /><Probe icon={[icons.Plus]} /></>',
      )}`,
    );
    expect(out).not.toMatch(/_cache\[\d+\] = \{\s*color: store\.color/);
    expect(out).not.toMatch(/_cache\[\d+\] = \[\.\.\.store\.items\]/);
    expect(out).not.toMatch(/_cache\[\d+\] = \[settings\.dark\]/);
    expect(out).toMatch(/_cache\[\d+\] = \[styles\.a\]/);
    expect(out).toMatch(/_cache\[\d+\] = \[icons\.Plus\]/);
  });

  it('组件上的 _bind 生成的更新回调也被缓存', async () => {
    const out = await compile(
      component('let on = _state(false)', '<Switch checked={_bind(on)} />'),
    );
    expect(out).toContain(
      'onUpdate:checked={_cache[0] || (_cache[0] = $event => on.value = $event)}',
    );
  });
});

// ───────────────────────── 运行时 ─────────────────────────

const apps: ReturnType<typeof createApp>[] = [];
afterEach(() => {
  while (apps.length) apps.pop()!.unmount();
});
function mount(root: ReturnType<typeof _component>) {
  const el = document.createElement('div');
  const app = createApp(root);
  apps.push(app);
  app.mount(el);
  return el;
}

let renders: Record<string, number> = {};
const hit = (name: string) => (renders[name] = (renders[name] ?? 0) + 1);
const Box = _component(({ children }: { children?: VNodeChild }) => () => {
  hit('Box');
  return <section>{children}</section>;
});
const Btn = _component(({ label, onPress }: { label: string; onPress?: () => void }) => () => {
  hit('Btn');
  return <button onClick={onPress}>{label}</button>;
});

describe('运行时', () => {
  it('父组件因为自己的状态重新渲染时，内容不变的子组件不跟着重做', async () => {
    let bump = () => {};
    const Page = _component(() => {
      let n = _state(0);
      bump = () => n++;
      return () => (
        <div>
          <b>{n}</b>
          <Box>
            <Btn label="保存" onPress={() => n++} />
          </Box>
        </div>
      );
    });
    const el = mount(Page);
    renders = {};
    bump();
    await nextTick();
    expect(renders).toEqual({});
    expect(el.textContent).toBe('1保存');
  });

  it('两处同类型的组件轮流出现在同一位置：按位置加的 key 让它们不被当成同一个，内容不串', async () => {
    let toggle = () => {};
    const Page = _component(() => {
      let first = _state(true);
      toggle = () => (first = !first);
      return () => (
        <div>
          {first ? (
            <>
              <Btn label="一" />
              <Box>
                <Btn label="甲" />
              </Box>
            </>
          ) : (
            <>
              <Box>
                <Btn label="乙" />
              </Box>
              <Box>
                <Btn label="丙" />
              </Box>
            </>
          )}
        </div>
      );
    });
    const el = mount(Page);
    expect(el.textContent).toBe('一甲');
    toggle();
    await nextTick();
    expect(el.textContent).toBe('乙丙');
    toggle();
    await nextTick();
    expect(el.textContent).toBe('一甲');
  });

  it('内容里读的响应式数据变了，显示它的组件照常更新；用到渲染里变量的内容也照常更新', async () => {
    let bump = () => {};
    const Page = _component(() => {
      let n = _state(0);
      bump = () => n++;
      return () => {
        const label = `第 ${n} 次`;
        return (
          <div>
            <Box>计数 {n}</Box>
            <Box>{label}</Box>
          </div>
        );
      };
    });
    const el = mount(Page);
    bump();
    await nextTick();
    expect([...el.querySelectorAll('section')].map((s) => s.textContent)).toEqual([
      '计数 1',
      '第 1 次',
    ]);
  });

  it('属性里读 store 成员的对象不缓存：store 变了、父组件重新渲染时子组件拿到新值', async () => {
    const store = reactive({ color: 'red' });
    let bump = () => {};
    const seen: string[] = [];
    const Probe = _component(({ look }: { look: { color: string } }) => () => {
      seen.push(look.color);
      return <i />;
    });
    const Page = _component(() => {
      let n = _state(0);
      bump = () => n++;
      return () => (
        <p>
          {n}
          <Probe look={{ color: store.color }} />
        </p>
      );
    });
    mount(Page);
    store.color = 'blue';
    bump();
    await nextTick();
    expect(seen.at(-1)).toBe('blue');
  });

  it('子节点是渲染函数变量：子组件按参数调用它', () => {
    const Rows = _component(({ children }: { children: (row: number) => VNodeChild }) => () => (
      <ul>{[1, 2].map((row) => children(row))}</ul>
    ));
    const Page = _component(() => {
      const renderRow = (row: number) => <li>{row}</li>;
      return () => <Rows>{renderRow}</Rows>;
    });
    expect(mount(Page).textContent).toBe('12');
  });

  it('缓存的函数每次渲染是同一个，调用时读到的是最新状态', async () => {
    let bump = () => {};
    const seen = new Set<unknown>();
    const Probe = _component(({ onPress }: { onPress: () => number }) => () => {
      seen.add(onPress);
      return <i>{onPress()}</i>;
    });
    const Page = _component(() => {
      let n = _state(0);
      let other = _state(0);
      bump = () => {
        n++;
        other++;
      };
      return () => (
        <p>
          {other}
          <Probe onPress={() => n} />
        </p>
      );
    });
    const el = mount(Page);
    bump();
    await nextTick();
    expect(seen.size).toBe(1);
    // 渲染时调用了函数、读到了 n：Probe 自己追踪到变化并更新
    expect(el.querySelector('i')!.textContent).toBe('1');
  });

  it('经中间组件转交：上层内容每次都变时，最里层跟着更新；渲染函数照常转交', async () => {
    const Middle = _component(({ children }: { children?: VNodeChild }) => () => (
      <Box>{children}</Box>
    ));
    const List = _component(({ children }: { children: (row: number) => VNodeChild }) => () => (
      <ul>{[1, 2].map((row) => children(row))}</ul>
    ));
    const Forward = _component(({ children }: { children: (row: number) => VNodeChild }) => () => (
      <List>{children}</List>
    ));
    let bump = () => {};
    const Page = _component(() => {
      let n = _state(0);
      bump = () => n++;
      return () => {
        const label = `第 ${n} 次`;
        return (
          <div>
            <Middle>{label}</Middle>
            <Forward>{(row: number) => <li>{row}</li>}</Forward>
          </div>
        );
      };
    });
    const el = mount(Page);
    bump();
    await nextTick();
    expect(el.querySelector('section')!.textContent).toBe('第 1 次');
    expect(el.querySelector('ul')!.textContent).toBe('12');
  });

  it('组件上的 _bind：缓存的更新回调照常写回', async () => {
    const Toggle = _component(({ checked = _bindable(false) }: { checked?: boolean }) => () => (
      <button onClick={() => (checked = !checked)}>{checked ? '开' : '关'}</button>
    ));
    const Page = _component(() => {
      let on = _state(false);
      return () => (
        <p>
          <Toggle checked={_bind(on)} />
          <b>{on ? 'on' : 'off'}</b>
        </p>
      );
    });
    const el = mount(Page);
    el.querySelector('button')!.click();
    await nextTick();
    expect(el.textContent).toBe('开on');
  });
});

it('深层嵌套：每个元素只汇总一次，200 层在 1.5 秒内编译完（原先逐层遍历子树，约 7 秒）', async () => {
  const depth = 200;
  const open = Array.from({ length: depth }, (_, i) => `<Box key="${i}" label={label}>`).join('');
  const code = [
    "import { Box } from './box';",
    `export const C = _component(({ label }: { label: string }) => () => ${open}<span>{label}</span>${'</Box>'.repeat(depth)});`,
  ].join('\n');
  const start = performance.now();
  const result = await compileRunes(code, 'deep.tsx');
  expect(performance.now() - start).toBeLessThan(1500);
  // 只用到 props：每一层都是稳定插槽
  expect(result!.code.match(/\$stable: true/g)).toHaveLength(depth);
});
