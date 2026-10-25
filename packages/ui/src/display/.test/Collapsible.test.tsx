import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Collapsible } from '../Collapsible';

describe('Collapsible', () => {
  it('触发器拿到 aria-expanded 与指向内容区的 aria-controls，点击切换并写回', async () => {
    let open = _state(false);
    const host = mount(() => (
      <Collapsible _open={_bind(open)} trigger={(props) => <button {...props}>更多</button>}>
        内容
      </Collapsible>
    ));
    const button = host.querySelector('button')!;
    const content = document.getElementById(button.getAttribute('aria-controls')!)!;
    expect(content.textContent).toBe('内容');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    await nextTick();
    expect(open).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('使用方给的 id 落到内容区，aria-controls 跟着它', () => {
    const host = mount(() => (
      <Collapsible id="details" trigger={(props) => <button {...props}>更多</button>}>
        内容
      </Collapsible>
    ));
    expect(host.querySelector('button')!.getAttribute('aria-controls')).toBe('details');
    expect(host.querySelector('#details')!.textContent).toBe('内容');
  });

  it('不绑定 open 时自己管理状态', async () => {
    const host = mount(() => (
      <Collapsible trigger={(props) => <button {...props}>更多</button>}>内容</Collapsible>
    ));
    const button = host.querySelector('button')!;
    button.click();
    await nextTick();
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('disabled：触发器带上 disabled，点击不切换', async () => {
    let open = _state(false);
    const host = mount(() => (
      <Collapsible _open={_bind(open)} disabled trigger={(props) => <span {...props}>更多</span>}>
        内容
      </Collapsible>
    ));
    const trigger = host.querySelector('span')!;
    expect(trigger.hasAttribute('disabled')).toBe(true);
    trigger.click();
    await nextTick();
    expect(open).toBe(false);
  });
});
