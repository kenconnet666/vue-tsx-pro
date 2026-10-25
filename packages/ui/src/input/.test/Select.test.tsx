// Select：只读（自己的 readonly 或 Field 的）不能打开、不能清空；前置图标与其他输入框一样画在外壳里；
// 多选的标签在触发按钮外（可移除、Backspace、maxTagCount），creatable 新建选项
import { Globe } from '@lucide/icons';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { Field } from '../../form/Field';
import { mount } from '../../utils/.test/mount';
import { Select } from '../Select';

const cities = ['北京', '上海', '广州'];

const flush = async () => {
  for (let index = 0; index < 5; index++) await nextTick();
};

// happy-dom 没有 popover API
beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});

describe('Select', () => {
  it('只读：点击、按键都不打开，没有清空按钮，触发按钮带 aria-readonly；Field 的 readonly 同样生效', async () => {
    let open = _state(false);
    const root = mount(() => (
      <>
        <Select
          items={cities}
          _value="上海"
          readonly
          clearable
          _open={_bind(open)}
          aria-label="城市"
        />
        <Field label="出发地" readonly>
          <Select items={cities} _value="北京" />
        </Field>
      </>
    ));
    const [own, fromField] = [
      ...root.querySelectorAll<HTMLButtonElement>('button[role="combobox"]'),
    ];
    own!.click();
    own!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await nextTick();
    expect(open).toBe(false);
    expect(own!.getAttribute('aria-readonly')).toBe('true');
    expect(fromField!.getAttribute('aria-readonly')).toBe('true');
    expect(root.querySelector('button[aria-label="清空"]')).toBeNull();
    expect(own!.textContent).toBe('上海');
  });

  it('单选的值是空字符串时算没有选中：显示占位文字，没有清空按钮', () => {
    const root = mount(() => (
      <Select items={cities} _value="" placeholder="全部" clearable aria-label="城市" />
    ));
    expect(root.querySelector('button[role="combobox"]')!.textContent).toBe('全部');
    expect(root.querySelector('button[aria-label="清空"]')).toBeNull();
  });

  it('清空：单选写回 null（同日期、数字控件的空值），多选写回空数组', async () => {
    let city = _state<string | null>('上海');
    let cityList = _state(['北京', '广州']);
    const root = mount(() => (
      <>
        <Select items={cities} _value={_bind(city)} clearable aria-label="城市" />
        <Select
          items={cities}
          selectionMode="multiple"
          _value={_bind(cityList)}
          clearable
          aria-label="途经"
        />
      </>
    ));
    for (const clear of root.querySelectorAll<HTMLButtonElement>('button[aria-label="清空"]')) {
      clear.click();
    }
    await nextTick();
    expect([city, cityList]).toEqual([null, []]);
  });

  it('不可搜索时弹层没有头部（不留空的分隔线）；可搜索时头部是搜索框', () => {
    const root = mount(() => (
      <>
        <Select items={cities} aria-label="城市" />
        <Select items={cities} searchable aria-label="出发地" />
      </>
    ));
    const [plain, searchable] = [...root.querySelectorAll('[popover]')];
    expect(plain!.firstElementChild!.querySelector('[role="listbox"]')).not.toBeNull();
    expect(searchable!.firstElementChild!.querySelector('input')).not.toBeNull();
  });

  it('前置图标在触发按钮之前，propsIcon 透传', () => {
    const root = mount(() => (
      <Select items={cities} icon={Globe} propsIcon={{ class: 'lead' }} aria-label="城市" />
    ));
    const icon = root.querySelector('.lead')!;
    expect(icon.nextElementSibling!.getAttribute('role')).toBe('combobox');
  });

  it('多选：标签在触发按钮外、对读屏隐藏，按钮里念全部已选；点移除按钮、Backspace 移除', async () => {
    let picked = _state(['北京', '上海', '广州']);
    const root = mount(() => (
      <Select items={cities} selectionMode="multiple" _value={_bind(picked)} aria-label="城市" />
    ));
    const trigger = root.querySelector<HTMLButtonElement>('button[role="combobox"]')!;
    expect(trigger.querySelector('button')).toBeNull();
    expect(trigger.textContent).toBe('北京、上海、广州');
    const row = trigger.previousElementSibling as HTMLElement;
    expect(row.getAttribute('aria-hidden')).toBe('true');
    const removes = row.querySelectorAll<HTMLButtonElement>('button');
    expect(removes).toHaveLength(3);
    expect(removes[0]!.tabIndex).toBe(-1);
    // 移除前先离场（测试环境没有动画，几个 tick 后结束）
    removes[1]!.click();
    await flush();
    expect(picked).toEqual(['北京', '广州']);
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    await nextTick();
    expect(picked).toEqual(['北京']);
  });

  it('maxTagCount：只显示前几个标签，其余收进“+N”；只读时标签没有移除按钮', () => {
    const root = mount(() => (
      <Select
        items={cities}
        selectionMode="multiple"
        _value={['北京', '上海', '广州']}
        maxTagCount={1}
        readonly
        aria-label="城市"
      />
    ));
    const trigger = root.querySelector('button[role="combobox"]')!;
    const row = trigger.previousElementSibling!;
    expect([...row.children].map((tag) => tag.textContent)).toEqual(['北京', '+2']);
    expect(row.querySelector('button')).toBeNull();
    // 读屏照样念全部
    expect(trigger.textContent).toBe('北京、上海、广州');
  });

  it('creatable：输入的文字没有对应选项时列表末尾多一项“新建”，选中后值就是这段文字并报告 onCreate', async () => {
    let picked = _state<string[]>([]);
    let search = _state('');
    const created: string[] = [];
    mount(() => (
      <Select
        items={cities}
        selectionMode="multiple"
        _value={_bind(picked)}
        _search={_bind(search)}
        _open
        creatable
        onCreate={(text) => created.push(text)}
        aria-label="城市"
      />
    ));
    search = '上海';
    await nextTick();
    const options = () =>
      [...document.querySelectorAll<HTMLElement>('[role="option"]')].map(
        (item) => item.textContent,
      );
    expect(options()).toEqual(['上海']);
    search = '深圳';
    await nextTick();
    expect(options()).toEqual(['新建“深圳”']);
    document.querySelector<HTMLElement>('[role="option"]')!.click();
    await nextTick();
    expect(picked).toEqual(['深圳']);
    expect(created).toEqual(['深圳']);
    expect(search).toBe('');
  });

  it('onOpenChange：点触发按钮打开是 trigger，单选选中一项关闭是 select；父级改 open 不通知', async () => {
    let open = _state(false);
    const onOpenChange = vi.fn();
    const root = mount(() => (
      <Select items={cities} _open={_bind(open)} onOpenChange={onOpenChange} aria-label="城市" />
    ));
    root.querySelector<HTMLButtonElement>('button[role="combobox"]')!.click();
    await flush();
    expect(open).toBe(true);
    expect(onOpenChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger' }),
    );
    expect(onOpenChange.mock.calls[0]![1].event).toBeInstanceOf(MouseEvent);
    document.querySelector<HTMLElement>('[role="option"]')!.click();
    await flush();
    expect(open).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'select' }),
    );
    open = true;
    await flush();
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });
});
