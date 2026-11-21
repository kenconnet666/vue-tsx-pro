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

  it('挪窗口：拖竖条上的按钮到另一组、用标题栏的菜单移到某处；浮动、拖标题栏挪、停靠回去；挪过的记在布局里', async () => {
    const windows: WorkbenchWindow[] = [
      { id: 'files', title: '文件', icon: FileText, anchor: 'left', content: () => '文件树' },
      {
        id: 'props',
        title: '属性',
        icon: SlidersHorizontal,
        anchor: 'right',
        content: () => '属性表',
      },
    ];
    let layout = _state<WorkbenchLayout>(defaultWorkbenchLayout(windows));
    const root = mount(() => (
      <Workbench windows={windows} _layout={layout}>
        主内容
      </Workbench>
    ));
    const [, right] = [...root.querySelectorAll('nav')];
    // 拖“文件”到右侧竖条：停到右边并显示（右边原来的让开）
    // 测试环境的 DragEvent 不带 dataTransfer：自己做一个，挂到事件上
    const data = new Map<string, string>();
    const transfer = {
      get types() {
        return [...data.keys()];
      },
      setData: (k: string, v: string) => data.set(k, v),
      getData: (k: string) => data.get(k) ?? '',
      dropEffect: '',
      effectAllowed: '',
    };
    const drag = (type: string, element: Element) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', { value: transfer });
      element.dispatchEvent(event);
    };
    drag('dragstart', button(root, '文件'));
    const target = right!.firstElementChild!;
    drag('dragover', target);
    drag('drop', target);
    await nextTick();
    expect(layout.anchors).toEqual({ files: 'right' });
    expect(layout.shown.right).toBe('files');
    expect(
      [...right!.querySelectorAll('[data-part="stripeButton"]')].map((b) =>
        b.getAttribute('aria-label'),
      ),
    ).toEqual(['文件', '属性']);

    // 菜单：属性移到下边，再浮动
    const menu = async (title: string, item: string) => {
      (root.querySelector(`[aria-label="${title}的选项"]`) as HTMLElement).click();
      await nextTick();
      const found = [...document.querySelectorAll('[role="menuitem"]')].find(
        (el) => el.textContent === item,
      ) as HTMLElement;
      found.click();
      await nextTick();
    };
    await menu('文件', '下边');
    expect([layout.anchors?.['files'], layout.shown.bottom, layout.shown.right]).toEqual([
      'bottom',
      'files',
      undefined,
    ]);
    await menu('文件', '浮动');
    expect(layout.floating?.['files']).toMatchObject({ open: true, width: 420, height: 320 });
    expect(layout.shown.bottom).toBeUndefined();
    const floating = root.querySelector('[data-part="float"]') as HTMLElement;
    expect(floating.textContent).toContain('文件树');
    // 拖浮动窗口的标题栏
    const header = floating.querySelector('[data-part="windowHeader"]') as HTMLElement;
    header.setPointerCapture = () => {};
    header.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 100,
        clientY: 100,
        pointerId: 1,
      }),
    );
    header.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, clientX: 130, clientY: 120, pointerId: 1 }),
    );
    header.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, clientX: 130, clientY: 120, pointerId: 1 }),
    );
    // 浏览器在松开后补发的 click（拖过以后被吞掉）
    header.click();
    await nextTick();
    expect([layout.floating?.['files']?.x, layout.floating?.['files']?.y]).toEqual([78, 68]);
    // 竖条上点它收起浮动的、再点显示
    button(root, '文件').click();
    await nextTick();
    expect(root.querySelector('[data-part="float"]')).toBeNull();
    button(root, '文件').click();
    await nextTick();
    await menu('文件', '停靠');
    expect([layout.floating?.['files'], layout.shown.bottom]).toEqual([undefined, 'files']);
  });
});
