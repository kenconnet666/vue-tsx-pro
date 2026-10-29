// 主题：暗色主题的类在小程序里展开成根节点上的变量（H5 是类）
import { mountPage } from '@zerodep-dev/vue-tsx-pro-mini/testing';
import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';
import { ConfigProvider } from '../ConfigProvider';

describe('ConfigProvider（小程序）', () => {
  it('暗色主题：根节点的行内样式里有暗色的变量值', async () => {
    const Demo = defineComponent(() => () => <ConfigProvider theme="dark">页面</ConfigProvider>);
    const page = mountPage(Demo);
    await page.settle();
    const root = page.find((node) => node.t === 'v')!;
    expect(root.st).toContain('--vtm-colors-background');
  });
});
