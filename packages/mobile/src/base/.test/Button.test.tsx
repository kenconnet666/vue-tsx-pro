// Button：H5 端的属性与点击拦截；小程序端的行内样式、按压态与点击
import { Plus } from '@lucide/icons';
import { mountPage } from '@zerodep-dev/vue-tsx-pro-mini/testing';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Button } from '../Button';

describe('Button（H5）', () => {
  it('type 默认 button；未声明的属性落到 button；图标与文字在内容层里', () => {
    const root = mount(() => (
      <Button icon={Plus} data-x="1" propsContent={{ class: 'content' }}>
        新建
      </Button>
    ));
    const button = root.querySelector('button')!;
    expect(button.type).toBe('button');
    expect(button.dataset.x).toBe('1');
    expect(root.querySelector('.content svg')).not.toBeNull();
    expect(button.textContent).toBe('新建');
  });

  it('加载中：aria-busy、不设 disabled，点击不调用使用方的回调', () => {
    const onClick = vi.fn();
    const root = mount(() => (
      <Button loading onClick={onClick}>
        提交
      </Button>
    ));
    const button = root.querySelector('button')!;
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.disabled).toBe(false);
    button.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('禁用：disabled 与 data-disabled，点击无效', () => {
    const onClick = vi.fn();
    const root = mount(() => (
      <Button disabled onClick={onClick}>
        删除
      </Button>
    ));
    const button = root.querySelector('button')!;
    expect(button.disabled).toBe(true);
    expect(button.hasAttribute('data-disabled')).toBe(true);
    button.click();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Button（小程序）', () => {
  it('样式展开成行内样式；按住时换成按下的底色；点击生效', async () => {
    const count = ref(0);
    const Demo = defineComponent(() => () => (
      <Button onClick={() => count.value++}>点了 {count.value}</Button>
    ));
    const page = mountPage(Demo);
    await page.settle();
    const button = page.find((node) => node.c?.includes('vtp-inline-block') ?? false)!;
    expect(button.st).toContain('background-color:var(--vtm-colors-accent)');

    await page.dispatch(button, 'touchstart');
    const pressed = page.find((node) => node.s === button.s)!;
    expect(pressed.st).toContain('background-color:var(--vtm-colors-accent-active)');
    await page.dispatch(button, 'touchend');
    await page.dispatch(button, 'tap');
    expect(page.text()).toContain('点了 1');
  });

  it('禁用的按钮按住也不变色，点不出 click', async () => {
    const onClick = vi.fn();
    const Demo = defineComponent(() => () => (
      <Button disabled onClick={onClick}>
        禁用
      </Button>
    ));
    const page = mountPage(Demo);
    await page.settle();
    const button = page.find((node) => node.c?.includes('vtp-inline-block') ?? false)!;
    await page.dispatch(button, 'touchstart');
    expect(page.find((node) => node.s === button.s)!.st).not.toContain('accent-active');
    await page.tap(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
