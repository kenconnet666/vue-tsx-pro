// Banner：标题与正文、操作、按 live 的角色；关闭先离场再报告，没被移除就重新出现
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { hasStyles, mount } from '../../utils/.test/mount';
import { presenceStyles } from '../../utils/style/transitions';
import { Banner } from '../Banner';

const flush = async () => {
  for (let i = 0; i < 4; i++) await nextTick();
};

describe('Banner', () => {
  it('标题加粗、与正文同一行；操作在后面；页面加载时就在的不带角色，live 时带', () => {
    const root = mount(() => (
      <>
        <Banner title="系统维护" action={<a href="/notice">查看详情</a>}>
          今晚 22:00–23:00 暂停服务
        </Banner>
        <Banner live="polite" tone="success">
          已恢复服务
        </Banner>
      </>
    ));
    const [first, second] = [...root.children] as HTMLElement[];
    expect(first!.querySelector('strong')!.textContent).toBe('系统维护');
    expect(first!.textContent).toBe('系统维护今晚 22:00–23:00 暂停服务查看详情');
    expect(first!.hasAttribute('role')).toBe(false);
    expect(second!.getAttribute('role')).toBe('status');
    expect(first!.querySelector('button')).toBeNull();
  });

  it('关闭：先离场（等过渡结束）再调用 onClose；使用方没移除时重新出现', async () => {
    const onClose = vi.fn();
    const root = mount(() => (
      <Banner tone="warning" onClose={onClose}>
        试用还剩 3 天
      </Banner>
    ));
    const banner = root.firstElementChild as HTMLElement;
    banner.querySelector('button')!.click();
    await nextTick();
    expect(banner.dataset.state).toBe('closed');
    expect(hasStyles(banner, presenceStyles.leaving)).toBe(true);
    await flush();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(banner.dataset.state).toBe('open');
  });
});
