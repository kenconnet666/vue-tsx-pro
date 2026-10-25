// CommandPalette 的远程搜索：inputValue 双向绑定、filter={false} 不在本地过滤、loading 时列表 aria-busy
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { CommandPalette } from '../CommandPalette';

const optionsOf = (root: HTMLElement) =>
  [...root.ownerDocument.querySelectorAll('[role="option"]')].map((option) => option.textContent);

describe('CommandPalette', () => {
  it('输入写回 inputValue；filter={false} 时 items 原样显示；loading 时列表忙碌', async () => {
    let open = _state(true);
    let keyword = _state('');
    let loading = _state(false);
    // 服务端返回的结果与输入无关：本地不该再过滤
    const results = ['订单 A-10200', '订单 A-10207'];
    const root = mount(() => (
      <CommandPalette
        _open={open}
        _inputValue={keyword}
        items={results}
        filter={false}
        loading={loading}
        hotkey={false}
        trigger={false}
        onAction={() => {}}
      />
    ));
    await nextTick();
    const input = root.ownerDocument.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    input.value = '林小满';
    input.dispatchEvent(new Event('input'));
    await nextTick();
    expect(keyword).toBe('林小满');
    expect(optionsOf(root)).toEqual(results);

    loading = true;
    await nextTick();
    expect(root.ownerDocument.querySelector('[role="listbox"]')!.getAttribute('aria-busy')).toBe(
      'true',
    );
  });

  it('默认按文字过滤；每次打开清空输入', async () => {
    let open = _state(true);
    let keyword = _state('');
    const root = mount(() => (
      <CommandPalette
        _open={open}
        _inputValue={keyword}
        items={['新建文档', '打开设置', '新建表格']}
        hotkey={false}
        trigger={false}
        onAction={() => {}}
      />
    ));
    keyword = '新建';
    await nextTick();
    expect(optionsOf(root)).toEqual(['新建文档', '新建表格']);
    open = false;
    await nextTick();
    open = true;
    await nextTick();
    expect(keyword).toBe('');
  });
});
