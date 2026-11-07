// Label：必填时标签后一个星号（只是外观）；for 指向一组控件（role="group"）时点标签聚焦组里第一个控件
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Label } from '../Field';

describe('Label', () => {
  it('必填加星号，不可用带 data-disabled', () => {
    const root = mount(() => (
      <>
        <Label required>邮箱</Label>
        <Label disabled>昵称</Label>
      </>
    ));
    const [required, disabled] = [...root.querySelectorAll('label')];
    expect(required!.querySelector('svg')).not.toBeNull();
    expect(disabled!.querySelector('svg')).toBeNull();
    expect([
      required!.hasAttribute('data-disabled'),
      disabled!.hasAttribute('data-disabled'),
    ]).toEqual([false, true]);
  });

  it('for 指向一组控件时，点标签聚焦组里第一个能聚焦的控件', () => {
    const root = mount(() => (
      <>
        <Label for="size">尺寸</Label>
        <div id="size" role="group">
          <span>说明</span>
          <button>小</button>
          <button>大</button>
        </div>
      </>
    ));
    root.querySelector('label')!.click();
    expect(document.activeElement?.textContent).toBe('小');
  });
});
