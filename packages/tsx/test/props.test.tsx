// _component 的 props：响应式解构、任意默认值、rest 与组件信息
import { afterEach, describe, it, expect } from 'vitest';
import { createApp, nextTick, ref, watch, type VNodeChild } from 'vue';
import { _component } from '../src';

const apps: ReturnType<typeof createApp>[] = [];
afterEach(() => {
  while (apps.length) apps.pop()!.unmount();
});
function mount(render: () => VNodeChild) {
  const el = document.createElement('div');
  const app = createApp(_component(() => render));
  apps.push(app);
  app.mount(el);
  return el;
}

let created = 0;
function makeList() {
  created++;
  return [] as string[];
}
const pick = (size: string) => (size === 'lg' ? '大' : '小');

interface BadgeProps {
  size?: string;
  icon?: string;
  index?: number;
  label?: string;
  list?: string[];
}

export const Badge = _component(
  ({
    size = 'md',
    icon = pick(size),
    index = -1,
    label = `#${index}`,
    list = makeList(),
  }: BadgeProps) => {
    // 同一实例里多次读取默认值，拿到的是同一个对象
    const sameList = list === list;
    return () => (
      <i data-same={String(sameList)}>
        {size}/{icon}/{index}/{label}/{list.length}
      </i>
    );
  },
);

describe('默认值', () => {
  it('任意表达式：负数、模板字符串、函数调用，以及引用前面的 prop', () => {
    const el = mount(() => <Badge />);
    expect(el.textContent).toBe('md/小/-1/#-1/0');
  });

  it('父级传值时用父级的，不传时回到默认值', async () => {
    const index = ref<number | undefined>(3);
    const el = mount(() => <Badge index={index.value} />);
    expect(el.textContent).toBe('md/小/3/#3/0');
    index.value = undefined;
    await nextTick();
    expect(el.textContent).toBe('md/小/-1/#-1/0');
  });

  it('引用其他 prop 的默认值随之更新', async () => {
    const size = ref('md');
    const el = mount(() => <Badge size={size.value} />);
    expect(el.textContent).toContain('/小/');
    size.value = 'lg';
    await nextTick();
    expect(el.textContent).toContain('lg/大/');
  });

  it('对象类默认值每个实例各自一份，同一实例只求值一次', () => {
    const before = created;
    const el = mount(() => (
      <>
        <Badge />
        <Badge />
      </>
    ));
    expect(created - before).toBe(2);
    expect(el.querySelector('i')!.dataset.same).toBe('true');
  });
});

describe('rest 与组件信息', () => {
  const Field = _component(
    ({
      value = _bindable(''),
      placeholder = '',
      ...rest
    }: {
      value?: string;
      placeholder?: string;
    }) =>
      () => <input {...rest} placeholder={placeholder} value={_bind(value)} />,
  );

  it('...rest 只包含未声明的属性，不含 prop 与双向绑定的更新回调', () => {
    const text = ref('a');
    const el = mount(() => <Field value={_bind(text.value)} placeholder="p" aria-label="名字" />);
    const input = el.querySelector('input')!;
    expect(input.getAttribute('aria-label')).toBe('名字');
    expect(input.getAttribute('placeholder')).toBe('p');
    expect(input.getAttributeNames().some((name) => name.toLowerCase().includes('update'))).toBe(
      false,
    );
  });

  it('带连字符的 prop 名按驼峰读取，双向绑定照常写回', async () => {
    const Labeled = _component(
      ({
        'aria-label': label = '',
        'model-value': text = _bindable(''),
      }: {
        'aria-label'?: string;
        'model-value'?: string;
      }) =>
        () => (
          <button type="button" onClick={() => (text = `${text}!`)}>
            {label}/{text}
          </button>
        ),
    );
    const text = ref('a');
    const el = mount(() => <Labeled aria-label="名字" model-value={_bind(text.value)} />);
    expect(el.textContent).toBe('名字/a');
    el.querySelector('button')!.click();
    await nextTick();
    expect(text.value).toBe('a!');
    expect((Labeled as unknown as { props: string[] }).props).toEqual([
      'ariaLabel',
      'modelValue',
      'onUpdate:modelValue',
    ]);
  });

  it('组件名取自变量名，props 声明自动生成', () => {
    const component = Badge as unknown as { name: string; props: string[] };
    expect(component.name).toBe('Badge');
    expect(component.props).toEqual(['size', 'icon', 'index', 'label', 'list']);
  });

  it('_toRef(prop) 是真正的 Ref，可以交给 watch', async () => {
    const seen: string[] = [];
    const Watcher = _component(({ size = 'md' }: { size?: string }) => {
      watch(_toRef(size), (value) => seen.push(value));
      return () => <i>{size}</i>;
    });
    const size = ref('md');
    mount(() => <Watcher size={size.value} />);
    size.value = 'lg';
    await nextTick();
    expect(seen).toEqual(['lg']);
  });
});

describe('临时覆盖（同 Svelte）', () => {
  const Editable = _component(({ label = '默认' }: { label?: string }) => () => (
    <button type="button" onClick={() => (label = '本地')}>
      {label}
    </button>
  ));

  it('普通 prop 可以在组件内覆盖，父级传入新值时以父级为准', async () => {
    const label = ref('甲');
    const el = mount(() => <Editable label={label.value} />);
    const button = el.querySelector('button')!;
    button.click();
    await nextTick();
    expect(button.textContent).toBe('本地');

    label.value = '乙';
    await nextTick();
    expect(button.textContent).toBe('乙');
  });

  it('父级没传时覆盖的是默认值', async () => {
    const el = mount(() => <Editable />);
    const button = el.querySelector('button')!;
    expect(button.textContent).toBe('默认');
    button.click();
    await nextTick();
    expect(button.textContent).toBe('本地');
  });
});
