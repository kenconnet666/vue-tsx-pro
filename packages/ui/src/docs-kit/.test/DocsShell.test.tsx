// DocsShell：站点导航、上一篇下一篇、首页不显示翻页、浏览器标签的标题、本页目录从正文收集
import { Box } from '@lucide/icons';
import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { lightTheme } from '../../config/theme/light';
import { createThemePreference } from '../../config/theme/preference';
import { mount } from '../../utils/.test/mount';
import { DocsShell } from '../DocsShell';

const sections = [
  {
    label: '开始',
    pages: [
      { path: '/guide/a', title: '第一篇', description: '说 `a`' },
      { path: '/guide/b', title: '第二篇' },
    ],
  },
  { label: '进阶', pages: [{ path: '/guide/c', title: '第三篇' }] },
];

function setup(path: string) {
  const current = ref(path);
  const preference = createThemePreference({ themes: { light: lightTheme } });
  const root = mount(() => (
    <DocsShell
      name="站点"
      icon={Box}
      sections={sections}
      path={current.value}
      onNavigate={vi.fn()}
      preference={preference}
      repository="https://example.com/repo"
    >
      <h2 id="one">一节</h2>
    </DocsShell>
  ));
  return { root, current };
}

describe('DocsShell', () => {
  it('侧栏列出所有页；中间的页有上一篇和下一篇；标题写到浏览器标签', async () => {
    const { root } = setup('/guide/b');
    await nextTick();
    const links = [...root.querySelectorAll('a')].map((link) => link.getAttribute('href'));
    for (const page of ['/guide/a', '/guide/b', '/guide/c']) expect(links).toContain(page);
    expect(links).toContain('https://example.com/repo');
    expect(root.querySelector('nav[aria-label="文档"]')).not.toBeNull();
    expect(root.textContent).toContain('第一篇');
    expect(document.title).toBe('第二篇 · 站点');
  });

  it('首页没有翻页，换地址时标题跟着变', async () => {
    const { root, current } = setup('/');
    await nextTick();
    expect(document.title).toBe('站点');
    const pagerLinks = () =>
      [...root.querySelectorAll('nav')].filter((nav) => /上一|下一/.test(nav.textContent ?? ''));
    expect(pagerLinks()).toHaveLength(0);
    current.value = '/guide/c';
    await nextTick();
    expect(document.title).toBe('第三篇 · 站点');
    expect(pagerLinks().length).toBeGreaterThan(0);
  });
});
