// 没配置时区时：服务端按 UTC 渲染，水合先按 UTC（节点对得上、不报不一致），挂载后换成浏览器的时区——
// 相对时间的悬停提示、日期时间的文字都改过来；语言配置了时区的两边一致、不变
import { describe, expect, it, vi } from 'vitest';
import { createSSRApp, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Provider } from '../../config/Provider';
import { defineLang } from '../../config/lang/lang';
import { zhCN } from '../../config/lang/zh-CN';
import { mount } from '../../utils/.test/mount';
import { DateTime } from '../DateTime';
import { RelativeTime } from '../RelativeTime';

// 浏览器在东八区（不依赖跑测试的机器的时区）
vi.mock('@internationalized/date', async (original) => ({
  ...(await original<typeof import('@internationalized/date')>()),
  getLocalTimeZone: () => 'Asia/Shanghai',
}));

// 东八区 09:42 = UTC 01:42
const AT = '2026-10-21T09:42:00+08:00';
const NOW = Date.parse('2026-10-21T10:00:00+08:00');

/** 服务端渲染出 HTML，再水合；返回容器与水合时有没有报不一致 */
async function hydrate(app: () => unknown) {
  const html = await renderToString(createSSRApp(app));
  const container = document.createElement('div');
  container.innerHTML = html;
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  createSSRApp(app).mount(container);
  const mismatched = /mismatch/i.test([...warn.mock.calls, ...error.mock.calls].flat().join('\n'));
  warn.mockRestore();
  error.mockRestore();
  return { html, container, mismatched };
}

describe('没配置时区时的服务端渲染与水合', () => {
  it('服务端按 UTC；水合不报不一致；挂载后提示与文字是浏览器时区的时间', async () => {
    const app = () => [<RelativeTime value={AT} now={NOW} />, <DateTime value={AT} />];
    const { html, container, mismatched } = await hydrate(app);
    // datetime 属性是机器读的原值；给人看的提示与文字是 UTC 的
    expect(html).toContain('星期三 01:42"');
    expect(html).toContain('2026年10月21日 01:42');
    expect(mismatched).toBe(false);
    await nextTick();
    const [relative, absolute] = container.querySelectorAll('time');
    expect(relative!.getAttribute('title')).toContain('09:42');
    expect(relative!.textContent).toBe('18分钟前');
    expect(absolute!.textContent).toContain('09:42');
  });

  it('只在浏览器里渲染：直接是浏览器的时区', () => {
    const root = mount(() => <RelativeTime value={AT} now={NOW} />);
    expect(root.querySelector('time')!.getAttribute('title')).toContain('09:42');
  });

  it('语言配置了时区：服务端、水合后都是它', async () => {
    const tokyo = defineLang(zhCN, { timeZone: 'Asia/Tokyo' });
    const app = () => (
      <Provider lang={tokyo}>
        <RelativeTime value={AT} now={NOW} />
      </Provider>
    );
    const { html, container, mismatched } = await hydrate(app);
    expect(html).toContain('10:42');
    expect(mismatched).toBe(false);
    await nextTick();
    expect(container.querySelector('time')!.getAttribute('title')).toContain('10:42');
  });
});
