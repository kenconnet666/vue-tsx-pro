// Button：类型、属性透传、加载中、不可用、组件默认值、sx 覆盖
import { Plus } from '@lucide/icons';
import { describe, expect, it, vi } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import { Provider } from '../../config/Provider';
import { mount } from '../../utils/.test/mount';
import { Button } from '../Button';

const first = <T extends Element>(root: Element, selector: string) =>
  root.querySelector<T>(selector)!;

describe('Button', () => {
  it('type 默认 button；属性落到 button；图标与文字都在内容层里', () => {
    const root = mount(() => (
      <Button icon={Plus} data-x="1" propsContent={{ class: 'content' }}>
        新建
      </Button>
    ));
    const button = first<HTMLButtonElement>(root, 'button');
    expect(button.type).toBe('button');
    expect(button.dataset.x).toBe('1');
    expect(first(root, '.content').querySelector('svg')).not.toBeNull();
    expect(button.textContent).toBe('新建');
  });

  it('loading 变为 true 后先拦下点击，过一会儿才换成加载指示（很快完成时不闪）', async () => {
    vi.useFakeTimers();
    const loading = shallowRef(false);
    const root = mount(() => <Button loading={loading.value}>保存</Button>);
    const button = first<HTMLButtonElement>(root, 'button');
    loading.value = true;
    await nextTick();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('svg')).toBeNull();
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(button.querySelector('svg')).not.toBeNull();
    vi.useRealTimers();
  });

  it('loading：不用 disabled（焦点保留），aria-busy，点击被拦下、不提交表单', () => {
    const onClick = vi.fn();
    const root = mount(() => (
      <Button loading onClick={onClick} type="submit">
        提交
      </Button>
    ));
    const button = first<HTMLButtonElement>(root, 'button');
    expect([button.disabled, button.getAttribute('aria-busy')]).toEqual([false, 'true']);
    expect(button.dataset.loading).toBe('true');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    expect(onClick).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
    // 加载中内容仍在（读屏名称不变），另有旋转指示
    expect(button.textContent).toBe('提交');
    expect(button.querySelectorAll('svg')).toHaveLength(1);
  });

  it('disabled 用原生属性；focusableWhenDisabled 改用 aria-disabled 并拦下点击', () => {
    const onClick = vi.fn();
    const root = mount(() => (
      <>
        <Button disabled>a</Button>
        <Button disabled focusableWhenDisabled onClick={onClick}>
          b
        </Button>
      </>
    ));
    const [hard, soft] = root.querySelectorAll('button');
    expect(hard!.disabled).toBe(true);
    expect([soft!.disabled, soft!.getAttribute('aria-disabled')]).toEqual([false, 'true']);
    soft!.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('组件默认值：Provider 的 defaults.Button 改默认外观，显式 prop 优先', () => {
    const root = mount(() => (
      <>
        <Button class="plain">a</Button>
        <Provider defaults={{ Button: { variant: 'outline' } }}>
          <Button class="configured">b</Button>
          <Button class="explicit" variant="solid">
            c
          </Button>
        </Provider>
      </>
    ));
    const classOf = (selector: string) =>
      first(root, selector).className.replace(selector.slice(1), '');
    expect(classOf('.configured')).not.toBe(classOf('.plain'));
    expect(classOf('.explicit')).toBe(classOf('.plain'));
  });

  it('使用方的 sx 在组件样式之后：可以覆盖', () => {
    const root = mount(() => <Button style={{ color: 'red' }}>a</Button>);
    expect(first<HTMLElement>(root, 'button').style.color).toBe('red');
  });
});
