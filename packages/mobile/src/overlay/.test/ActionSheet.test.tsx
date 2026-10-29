// ActionSheet：选中回调与关闭原因、禁用与加载中的项不能选、取消；小程序端渲染与点击
import { mountPage } from '@zerodep-dev/vue-tsx-pro-mini/testing';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { mount } from '../../utils/.test/mount';
import { ActionSheet, type ActionSheetAction } from '../ActionSheet';

const actions: ActionSheetAction[] = [
  { name: '微信' },
  { name: '朋友圈', disabled: true },
  { name: '上传中', loading: true },
  { name: '删除', tone: 'danger', description: '不能恢复' },
];

describe('ActionSheet（H5）', () => {
  it('选中一项：回调带项与序号，关闭原因是 select；禁用、加载中的不能选', () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    mount(() => (
      <ActionSheet
        _open
        title="分享到"
        actions={actions}
        onSelect={onSelect}
        onOpenChange={onOpenChange}
      />
    ));
    const buttons = [
      ...document.body.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'),
    ];
    expect(buttons.map((button) => button.textContent)).toEqual([
      '微信',
      '朋友圈',
      '',
      '删除不能恢复',
      '取消',
    ]);
    expect(buttons[2]!.getAttribute('aria-busy')).toBe('true');
    buttons[1]!.click();
    buttons[2]!.click();
    expect(onSelect).not.toHaveBeenCalled();
    buttons[3]!.click();
    expect(onSelect).toHaveBeenCalledWith(actions[3], 3);
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'select' });
  });

  it('取消：onCancel 与 cancel 原因；showCancel=false 时没有取消', () => {
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    mount(() => (
      <ActionSheet
        _open
        actions={actions.slice(0, 1)}
        onCancel={onCancel}
        onOpenChange={onOpenChange}
      />
    ));
    const buttons = document.body.querySelectorAll<HTMLButtonElement>('[role="dialog"] button');
    buttons[buttons.length - 1]!.click();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'cancel' });

    mount(() => <ActionSheet _open showCancel={false} actions={actions.slice(0, 1)} />);
    expect(document.body.querySelectorAll('[role="dialog"]')[1]!.textContent).toBe('微信');
  });
});

describe('ActionSheet（小程序）', () => {
  it('渲染到浮层节点，点一项选中并关闭', async () => {
    const open = ref(true);
    const picked = ref(-1);
    const Demo = defineComponent(() => () => (
      <ActionSheet
        _open={open.value}
        actions={actions}
        onSelect={(_, index) => (picked.value = index)}
        onOpenChange={(next) => (open.value = next)}
      />
    ));
    const page = mountPage(Demo);
    await page.settle();
    expect(page.text()).toContain('微信朋友圈');
    const wechat = page.find(
      (node) => node.t === 'x' && JSON.stringify(node).includes('"v":"微信"'),
    )!;
    await page.tap(wechat);
    expect(picked.value).toBe(0);
    expect(open.value).toBe(false);
  });
});
