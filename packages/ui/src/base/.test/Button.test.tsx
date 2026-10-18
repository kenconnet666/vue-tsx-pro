// 按钮家族：Button、LinkButton、IconButton、CloseButton、ClearButton 的行为与组件默认值
import { Plus, Settings } from '@lucide/icons';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { Provider } from '../../config/Provider';
import { mount } from '../../utils/.test/mount';
import { Button } from '../Button';
import { ClearButton, CloseButton } from '../CloseButton';
import { IconButton } from '../IconButton';
import { LinkButton } from '../LinkButton';

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

describe('LinkButton', () => {
  it('渲染 a；external 时新窗口打开、带外链图标与读屏提示', () => {
    const root = mount(() => (
      <LinkButton href="https://example.com" external>
        文档
      </LinkButton>
    ));
    const link = first<HTMLAnchorElement>(root, 'a');
    expect([link.target, link.rel]).toEqual(['_blank', 'noopener noreferrer']);
    expect(link.querySelector('svg')).not.toBeNull();
    expect(link.textContent).toContain('（在新窗口打开）');
  });

  it('站内链接经 router 跳转；disabled 时去掉 href，保留 role="link" 与 aria-disabled', async () => {
    const navigate = vi.fn();
    let disabled = _state(false);
    const root = mount(() => (
      <Provider router={{ navigate }}>
        <LinkButton href="/orders" disabled={disabled}>
          订单
        </LinkButton>
      </Provider>
    ));
    const link = () => first<HTMLAnchorElement>(root, 'a');
    link().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    expect(navigate).toHaveBeenCalledWith('/orders');

    disabled = true;
    await nextTick();
    expect(link().hasAttribute('href')).toBe(false);
    expect([link().getAttribute('role'), link().getAttribute('aria-disabled')]).toEqual([
      'link',
      'true',
    ]);
  });
});

describe('IconButton 与预设', () => {
  it('IconButton：名称来自 aria-label，图标部件属性可覆盖', () => {
    const root = mount(() => (
      <IconButton icon={Settings} aria-label="设置" propsIcon={{ class: 'gear' }} />
    ));
    const button = first(root, 'button');
    expect(button.getAttribute('aria-label')).toBe('设置');
    expect(button.querySelector('svg.gear')).not.toBeNull();
  });

  it('CloseButton、ClearButton：名称取语言包，可以用 aria-label 改', () => {
    const root = mount(() => (
      <>
        <CloseButton />
        <ClearButton />
        <CloseButton aria-label="关闭对话框" />
      </>
    ));
    expect([...root.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))).toEqual([
      '关闭',
      '清空',
      '关闭对话框',
    ]);
  });
});

// 类型：IconButton 必须有 aria-label
// @ts-expect-error 缺少 aria-label
export const unnamed = () => <IconButton icon={Settings} />;
