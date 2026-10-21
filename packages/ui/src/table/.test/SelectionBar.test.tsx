// SelectionBar：有选择时显示数目和取消选择；数目变成 0 后淡出卸载，淡出时不闪成“已选 0 项”
import { nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { SelectionBar } from '../SelectionBar';

describe('SelectionBar', () => {
  it('显示已选数目；点取消选择调用 onClear；数目为 0 时卸载', async () => {
    let count = _state(2);
    const onClear = vi.fn(() => (count = 0));
    const host = mount(() => (
      <SelectionBar count={count} onClear={onClear}>
        <button>批量导出</button>
      </SelectionBar>
    ));
    const bar = () => host.firstElementChild as HTMLElement | null;
    const live = bar()!.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe('已选 2 项');
    expect(bar()!.lastElementChild!.textContent).toBe('批量导出');

    count = 5;
    await nextTick();
    expect(live.textContent).toBe('已选 5 项');

    [...bar()!.querySelectorAll('button')].find((b) => b.textContent === '取消选择')!.click();
    expect(onClear).toHaveBeenCalledTimes(1);
    await nextTick();
    expect(bar()?.dataset.state).toBe('closed');
    expect(live.textContent).toBe('已选 5 项');
    await vi.waitFor(() => expect(bar()).toBeNull());
  });

  it('label 换掉默认的数目文字', () => {
    const host = mount(() => <SelectionBar count={1286} label="已选全部 1,286 项" />);
    expect(host.querySelector('[aria-live]')!.textContent).toBe('已选全部 1,286 项');
    expect(mount(() => <SelectionBar count={0} />).firstElementChild).toBeNull();
  });
});
