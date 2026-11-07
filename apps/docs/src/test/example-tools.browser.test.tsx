// 示例工具：默认不包；勾“从右到左”“窄屏”后示例包进带 dir 与限宽的一层；反色主题给示例换一套 token
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button } from '@zerodep-dev/vue-tsx-pro-ui';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { mount } from './mount';
import { Example } from '../site/Example';

const demo = {
  component: _component(() => () => <Button>保存</Button>),
  source: () => Promise.resolve('<Button>保存</Button>'),
  path: 'test/Save',
};

it('勾选示例工具后包一层：从右到左、窄屏、反色主题', async () => {
  await page.viewport(1000, 800);
  const root = mount(_component(() => () => <Example id="save" title="保存" demo={demo} />));
  const button = () => root.querySelector<HTMLButtonElement>('[data-demo] button')!;
  expect(button().closest('[dir]')).toBeNull();

  root.querySelector<HTMLButtonElement>('button[aria-label="示例工具"]')!.click();
  const item = (text: string) =>
    [...document.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"]')].find((element) =>
      element.textContent?.includes(text),
    )!;
  await expect.poll(() => item('从右到左')).toBeTruthy();
  item('从右到左').click();
  item('窄屏').click();
  await expect.poll(() => button().closest('[dir="rtl"]')).not.toBeNull();
  expect(button().closest('[dir="rtl"]')!.getBoundingClientRect().width).toBeLessThanOrEqual(375);

  item('反色主题').click();
  await expect.poll(() => button().closest('[data-theme]')).not.toBeNull();
});
