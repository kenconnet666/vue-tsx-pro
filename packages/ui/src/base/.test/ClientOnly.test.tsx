// ClientOnly：挂载前画 fallback（服务端渲染与水合时两边一致），挂载后画内容
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createSSRApp } from 'vue';
import { mount } from '../../utils/.test/mount';
import { ClientOnly } from '../ClientOnly';

describe('ClientOnly', () => {
  it('服务端渲染只有 fallback', async () => {
    const html = await renderToString(
      createSSRApp(() => (
        <ClientOnly fallback={<i>占位</i>}>
          <b>图表</b>
        </ClientOnly>
      )),
    );
    expect(html).toBe('<i>占位</i>');
  });

  it('浏览器里挂载后画出内容', async () => {
    const root = mount(() => (
      <ClientOnly fallback={<i>占位</i>}>
        <b>图表</b>
      </ClientOnly>
    ));
    await nextTick();
    expect(root.textContent).toBe('图表');
  });
});
