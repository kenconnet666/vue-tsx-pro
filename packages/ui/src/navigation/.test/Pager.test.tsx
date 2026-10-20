// Pager：上一篇、下一篇的链接，带 rel 与语言包里的提示
import { expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Pager } from '../Pager';

it('两侧各一个链接（rel="prev" / "next"）；只给一侧时只有一个', () => {
  const root = mount(() => (
    <>
      <Pager
        previous={{ href: '/button', label: 'Button' }}
        next={{ href: '/dialog', label: 'Dialog' }}
      />
      <Pager next={{ href: '/intro', label: '介绍' }} />
    </>
  ));
  const [both, onlyNext] = root.querySelectorAll('nav');
  expect(both!.getAttribute('aria-label')).toBe('翻页');
  const links = [...both!.querySelectorAll('a')].map((a) => [
    a.getAttribute('href'),
    a.getAttribute('rel'),
    a.textContent,
  ]);
  expect(links).toEqual([
    ['/button', 'prev', '上一篇Button'],
    ['/dialog', 'next', '下一篇Dialog'],
  ]);
  expect(onlyNext!.querySelectorAll('a')).toHaveLength(1);
});
