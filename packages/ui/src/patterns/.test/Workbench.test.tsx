// Workbench：默认布局、竖条开关工具窗口、跟着可用性自动显示与收起，开关工具窗口时主内容不重建
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, onMounted } from 'vue';
import { FileText, ListTree, ScrollText, SlidersHorizontal } from '@lucide/icons';
import { mount } from '../../utils/.test/mount';
import {
  defaultWorkbenchLayout,
  Workbench,
  type WorkbenchLayout,
  type WorkbenchWindow,
} from '../Workbench';

const stripe = (root: Element) => [
  ...root.querySelectorAll<HTMLElement>('[data-part="stripeButton"]'),
];
const pressed = (root: Element) =>
  stripe(root).map((b) => `${b.getAttribute('aria-label')}:${b.getAttribute('aria-pressed')}`);
const button = (root: Element, label: string) =>
  stripe(root).find((b) => b.getAttribute('aria-label') === label)!;

describe('Workbench', () => {
  let mounts = 0;
  const Main = defineComponent(() => {
    onMounted(() => mounts++);
    return () => h('div', '画布');
  });

  it('默认显示左右两边排在前面的窗口；竖条点一下收起、再点显示；跟着可用性自动显示、收起；主内容不重建', async () => {
    let running = _state(false);
    const windows = (): WorkbenchWindow[] => [
      { id: 'files', title: '文件', icon: FileText, anchor: 'left', content: () => '文件树' },
      { id: 'outline', title: '大纲', icon: ListTree, anchor: 'leftBottom', content: () => '大纲' },
      {
        id: 'props',
        title: '属性',
        icon: SlidersHorizontal,
        anchor: 'right',
        content: () => '属性表',
      },
      {
        id: 'log',
        title: '日志',
        icon: ScrollText,
        anchor: 'bottom',
        available: running,
        showWhenAvailable: true,
        content: () => '日志',
      },
    ];
    let layout = _state<WorkbenchLayout>(defaultWorkbenchLayout(windows()));
    mounts = 0;
    const root = mount(() => (
      <Workbench windows={windows()} _layout={layout}>
        {h(Main)}
      </Workbench>
    ));
    expect(layout.shown).toEqual({ left: 'files', leftBottom: 'outline', right: 'props' });
    // 不可用的日志不在竖条上
    expect(pressed(root)).toEqual(['文件:true', '大纲:true', '属性:true']);
    expect(root.textContent).toContain('属性表');

    button(root, '属性').click();
    await nextTick();
    expect(layout.shown.right).toBeUndefined();
    expect(root.textContent).not.toContain('属性表');

    running = true;
    await nextTick();
    await nextTick();
    expect(layout.shown.bottom).toBe('log');
    expect(pressed(root)).toContain('日志:true');
    running = false;
    await nextTick();
    await nextTick();
    expect(layout.shown.bottom).toBeUndefined();

    button(root, '属性').click();
    await nextTick();
    expect(root.textContent).toContain('属性表');
    expect(mounts).toBe(1);
  });

  it('工具窗口的标题栏：名字、补充说明、自己的按钮、收起', async () => {
    const windows: WorkbenchWindow[] = [
      {
        id: 'props',
        title: '属性',
        icon: SlidersHorizontal,
        anchor: 'right',
        detail: 'Button.tsx',
        actions: () => h('button', '刷新'),
        content: () => '属性表',
      },
    ];
    let layout = _state<WorkbenchLayout>(defaultWorkbenchLayout(windows));
    const root = mount(() => (
      <Workbench windows={windows} _layout={layout}>
        主内容
      </Workbench>
    ));
    const header = root.querySelector('[data-part="windowHeader"]')!;
    expect(header.textContent).toContain('属性');
    expect(header.textContent).toContain('Button.tsx');
    expect(header.textContent).toContain('刷新');
    header.querySelector<HTMLElement>('button[aria-label="收起属性"]')!.click();
    await nextTick();
    expect(layout.shown.right).toBeUndefined();
  });
});
