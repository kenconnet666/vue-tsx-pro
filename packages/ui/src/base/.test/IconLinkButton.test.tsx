// IconLinkButton：图标链接的名称、外部链接、站内跳转、不可用
import { Settings } from '@lucide/icons';
import { expect, it, vi } from 'vitest';
import { Provider } from '../../config/Provider';
import { mount } from '../../utils/.test/mount';
import { IconLinkButton } from '../IconLinkButton';

it('外部链接：新窗口打开，名称补上“在新窗口打开”', () => {
  const link = mount(() => (
    <IconLinkButton href="https://example.com" external icon={Settings} aria-label="仓库" />
  )).querySelector('a')!;
  expect([link.target, link.rel]).toEqual(['_blank', 'noopener noreferrer']);
  expect(link.getAttribute('aria-label')).toBe('仓库（在新窗口打开）');
  expect(link.querySelector('svg')).not.toBeNull();
});

it('站内链接经 router 跳转；disabled 时去掉 href', () => {
  const navigate = vi.fn();
  const root = mount(() => (
    <Provider router={{ navigate }}>
      <IconLinkButton href="/settings" icon={Settings} aria-label="设置" />
      <IconLinkButton href="/x" icon={Settings} aria-label="不可用" disabled />
    </Provider>
  ));
  const [enabled, disabled] = root.querySelectorAll('a');
  enabled!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  expect(navigate).toHaveBeenCalledWith('/settings');
  expect(disabled!.hasAttribute('href')).toBe(false);
  expect(disabled!.getAttribute('aria-disabled')).toBe('true');
});

// 类型：必须有 aria-label
// @ts-expect-error 缺少 aria-label
export const unnamed = () => <IconLinkButton href="/" icon={Settings} />;
