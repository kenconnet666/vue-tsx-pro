// ButtonBase：默认 type="button"（放在表单里不提交）；不可用是原生 disabled，focusableWhenDisabled 时改成
// aria-disabled 仍可聚焦、点了不触发；加载中 aria-busy、点了不触发
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { ButtonBase } from '../ButtonBase';

describe('ButtonBase', () => {
  it('默认 type="button"', () => {
    const root = mount(() => <ButtonBase>保存</ButtonBase>);
    expect(root.querySelector('button')!.type).toBe('button');
  });

  it('不可用：原生 disabled；focusableWhenDisabled 时 aria-disabled、可聚焦、点了不触发', () => {
    let clicks = 0;
    const root = mount(() => (
      <>
        <ButtonBase disabled>删除</ButtonBase>
        <ButtonBase disabled focusableWhenDisabled onClick={() => clicks++}>
          提交
        </ButtonBase>
      </>
    ));
    const [plain, soft] = [...root.querySelectorAll('button')];
    expect(plain!.disabled).toBe(true);
    expect(soft!.disabled).toBe(false);
    expect(soft!.getAttribute('aria-disabled')).toBe('true');
    soft!.focus();
    expect(document.activeElement).toBe(soft);
    soft!.click();
    expect(clicks).toBe(0);
  });

  it('加载中：aria-busy，点了不触发', () => {
    let clicks = 0;
    const root = mount(() => (
      <ButtonBase loading onClick={() => clicks++}>
        保存
      </ButtonBase>
    ));
    const button = root.querySelector('button')!;
    expect(button.getAttribute('aria-busy')).toBe('true');
    button.click();
    expect(clicks).toBe(0);
  });
});
