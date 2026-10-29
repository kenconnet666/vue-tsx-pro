// 命令式反馈：showToast 的自动关闭与替换、showDialog 的结果与排队、嵌套 ConfigProvider 只渲染一个出口
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { ConfigProvider } from '../../config/ConfigProvider';
import { mount } from '../../utils/.test/mount';
import { showConfirmDialog, showDialog } from '../Dialog';
import { closeToast, showLoadingToast, showToast } from '../Toast';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const toasts = () => [...document.body.querySelectorAll('[role="status"]')];
const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]');

// 命令式状态是模块级的，用例之间要复位
afterEach(() => closeToast());

describe('showToast', () => {
  it('嵌套的 ConfigProvider 只有一个出口；到时间自动关闭', async () => {
    mount(() => (
      <ConfigProvider>
        <ConfigProvider theme="dark">页面</ConfigProvider>
      </ConfigProvider>
    ));
    showToast({ message: '已复制', duration: 100 });
    await nextTick();
    expect(toasts()).toHaveLength(1);
    expect(toasts()[0]!.textContent).toBe('已复制');
    await wait(100 + 300);
    expect(toasts()).toHaveLength(0);
  });

  it('后一个替换前一个；前一个的 close() 不关后一个', async () => {
    mount(() => <ConfigProvider>页面</ConfigProvider>);
    const loading = showLoadingToast('提交中');
    await nextTick();
    expect(document.body.textContent).toContain('提交中');
    showToast('提交成功');
    loading.close();
    await nextTick();
    expect(toasts()).toHaveLength(1);
    expect(toasts()[0]!.textContent).toBe('提交成功');
  });
});

describe('showDialog', () => {
  it('确认得到 true、取消得到 false；排队的下一个在前一个关闭后显示', async () => {
    mount(() => <ConfigProvider>页面</ConfigProvider>);
    const first = showConfirmDialog({ title: '删除地址', message: '删除后不能恢复' });
    const second = showDialog({ title: '第二个' });
    await nextTick();
    expect(dialog()!.textContent).toContain('删除地址删除后不能恢复');
    const [cancel] = dialog()!.querySelectorAll('button');
    cancel!.click();
    expect(await first).toBe(false);

    await wait(350);
    await nextTick();
    expect(dialog()!.textContent).toContain('第二个');
    dialog()!.querySelector('button')!.click();
    expect(await second).toBe(true);
  });
});
