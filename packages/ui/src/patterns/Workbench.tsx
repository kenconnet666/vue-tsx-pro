/**
 * 工作台（参考 JetBrains IDE 的工具窗口）：中间是主内容（编辑器、画布、视口），四周停着工具窗口——项目树、属性、日志、
 * 时间轴；两侧的窄竖条上是它们的图标，点一下显示、再点收起。在线 IDE、设计工具、低代码平台、数据工作台的整页骨架。
 *
 *   let layout = _fromRef(usePersistentState('editor.layout', defaultWorkbenchLayout(windows)));
 *   <Workbench windows={windows} _layout={layout} header={<MainToolbar />} footer={<StatusBar />}>
 *     <Canvas />
 *   </Workbench>
 *
 *   const windows: WorkbenchWindow[] = [
 *     { id: 'files', title: '文件', icon: FolderTree, anchor: 'left', content: () => <FileTree /> },
 *     { id: 'outline', title: '大纲', icon: ListTree, anchor: 'leftBottom', content: () => <Outline /> },
 *     { id: 'props', title: '属性', icon: SlidersHorizontal, anchor: 'right', content: () => <Inspector /> },
 *     { id: 'log', title: '日志', icon: ScrollText, anchor: 'bottom', available: running, showWhenAvailable: true, content: () => <Log /> },
 *   ];
 *
 * - 停靠：左、右两边各能上下放两个（left / leftBottom、right / rightBottom），下边一个、占满整宽（同 JetBrains 的默认）。
 *   同一处一次只显示一个，显示另一个时原来的让开。左侧竖条的上面一组是左边的窗口，下面一组是停在下边的；右侧竖条是右边的。
 * - 主内容一直在：几层分栏一直都在，收起一边是把那一栏折叠起来——画布、iframe、视频不会因为开关工具窗口被重建。
 * - 布局（显示哪些、各占多大）是 _layout，父级双向绑定；要记住时配 usePersistentState（见上面的例子）。
 * - available 是 false 的窗口（跟着正在编辑的东西出现的：时间轴、调试）不显示、竖条上也没有它；showWhenAvailable 时它变得
 *   可用就自动显示，不可用时自动收起。
 * - 工具窗口的标题栏：名字、detail（补充说明，比如打开的文件）、actions（这个窗口自己的按钮）、收起按钮。内容默认放进
 *   ScrollArea；scroll 是 self 时铺满、自己管滚动（树、表格、画布）。
 * - 子组件经 WorkbenchContext 拿到 show / hide / toggle，在别处打开某个工具窗口（"在属性面板里查看"）。
 *
 * 部件（data-scope="workbench"）：Root、Body、Stripe（两侧的竖条）、StripeButton、Main（主内容）、Window（工具窗口）、
 * WindowHeader、WindowTitle、WindowDetail、WindowActions、WindowBody。
 */
import { _component, createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Minus } from '@lucide/icons';
import { watch, type VNodeChild } from 'vue';
import type { IconData } from '../base/Icon';
import { IconButton } from '../base/IconButton';
import { useMessages } from '../config/lang/messages';
import { partAttrs } from '../config/styles';
import { ScrollArea } from '../layout/ScrollArea';
import { Splitter } from '../layout/Splitter';
import { mergeAttrs, type PartProps } from '../utils/props';
import { patternsMessages } from './messages';

/** 工具窗口停在哪 */
export type WorkbenchAnchor = 'left' | 'leftBottom' | 'right' | 'rightBottom' | 'bottom';

/** 一个工具窗口 */
export interface WorkbenchWindow {
  /** 标识（布局里记的是它） */
  readonly id: string;
  /** 名字：标题栏、竖条按钮的名称 */
  readonly title: string;
  /** 竖条上的图标 */
  readonly icon: IconData;
  /** 停在哪 */
  readonly anchor: WorkbenchAnchor;
  /** 内容 */
  readonly content: () => VNodeChild;
  /** 现在能不能用；false 时不显示，竖条上也没有它。默认 true */
  readonly available?: boolean;
  /** 变得可用时自动显示、不可用时自动收起（跟着正在编辑的东西出现的窗口） */
  readonly showWhenAvailable?: boolean;
  /** 标题后面的补充说明（打开的文件、编辑的对象） */
  readonly detail?: string;
  /** 标题栏里这个窗口自己的按钮 */
  readonly actions?: () => VNodeChild;
  /**
   * 内容怎么滚动：area 放进 ScrollArea（默认）；self 铺满，内容自己管滚动（树、表格、画布）
   * @default 'area'
   */
  readonly scroll?: 'area' | 'self';
}

/** 布局：每一处显示的窗口和各块的大小（百分比） */
export interface WorkbenchLayout {
  /** 每一处显示的窗口的 id；没写的是收着 */
  readonly shown: Readonly<Partial<Record<WorkbenchAnchor, string>>>;
  /** 左栏占工作区的宽度、左栏里上面那个占的高度、右栏占（左栏以外的）宽度、右栏里上面那个占的高度、下栏占的高度 */
  readonly sizes: Readonly<{
    left: number;
    leftSplit: number;
    right: number;
    rightSplit: number;
    bottom: number;
  }>;
}

/** 工作台交给子组件的控制 */
export interface WorkbenchState {
  /** 显示这个工具窗口（同一处原来的让开） */
  show(id: string): void;
  /** 收起这个工具窗口 */
  hide(id: string): void;
  /** 显示着就收起，收着就显示 */
  toggle(id: string): void;
  /** 正显示着 */
  isShown(id: string): boolean;
}

/** 工作台的上下文：里面的组件用 WorkbenchContext.use() 打开别的工具窗口 */
export const WorkbenchContext = createContext<WorkbenchState>('Workbench');

/** 默认的布局：左、右两边各处显示排在前面的那个窗口，下边收着（等它的窗口变得可用） */
export function defaultWorkbenchLayout(windows: readonly WorkbenchWindow[]): WorkbenchLayout {
  const shown: Partial<Record<WorkbenchAnchor, string>> = {};
  for (const window of windows)
    if (window.anchor !== 'bottom' && shown[window.anchor] === undefined)
      shown[window.anchor] = window.id;
  return { shown, sizes: { left: 18, leftSplit: 55, right: 24, rightSplit: 55, bottom: 35 } };
}

/** 未声明的属性落到根元素上 */
export interface WorkbenchProps extends PartProps<'div'> {
  /** 工具窗口 */
  windows: readonly WorkbenchWindow[];
  /** 布局：父级写 _layout={x} 双向绑定；不写时按 defaultWorkbenchLayout */
  _layout?: WorkbenchLayout;
  /** 最上面（主工具条、菜单） */
  header?: VNodeChild;
  /** 最下面（状态栏） */
  footer?: VNodeChild;
  /** 主内容 */
  children?: VNodeChild;
}

/** 部件的标记（data-scope="workbench"） */
const workbenchPart = (part: string) => partAttrs({ name: 'Workbench' }, part);

/** Workbench 的样式：root、body、stripe、main、window 等 */
export const workbenchStyles = css.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '_full',
    minHeight: 0,
    backgroundColor: '_background',
    color: '_text',
  },
  body: { flex: 1, minHeight: 0, display: 'flex' },
  stripe: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    paddingBlock: '_xs',
    width: '2.25rem',
    flexShrink: 0,
    backgroundColor: '_surfaceRaised',
  },
  stripeStart: {
    borderInlineEndWidth: 1,
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: '_borderMuted',
  },
  stripeEnd: {
    borderInlineStartWidth: 1,
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: '_borderMuted',
  },
  push: { flex: 1 },
  work: { flex: 1, minWidth: 0, position: 'relative' },
  // 分栏里套的分栏、工具窗口铺满那一栏（栏是滚动区域，内容层按内容定高，height: 100% 撑不住）
  fill: { position: 'absolute', inset: 0 },
  window: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '_surface',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    minHeight: '1.875rem',
    flexShrink: 0,
    paddingInlineStart: '_sm',
    paddingInlineEnd: '2px',
    borderBlockEndWidth: 1,
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_borderMuted',
  },
  title: { fontWeight: '_semibold', fontSize: '_sm', whiteSpace: 'nowrap' },
  detail: {
    color: '_textMuted',
    fontSize: '_sm',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginInlineStart: '_xs',
    minWidth: 0,
  },
  actions: { display: 'flex', alignItems: 'center', gap: '2px', marginInlineStart: 'auto' },
  windowBody: { flex: 1, minHeight: 0, position: 'relative' },
});

type Sizes = WorkbenchLayout['sizes'];

/** 工作台 */
export const Workbench = _component(
  ({
    windows,
    _layout: layout = _bindable<WorkbenchLayout>(),
    header,
    footer,
    children,
    ...rest
  }: WorkbenchProps) => {
    const lang = useMessages('patterns', patternsMessages);
    if (!layout) layout = defaultWorkbenchLayout(windows);
    const byId = (id: string | undefined) =>
      id === undefined ? undefined : windows.find((window) => window.id === id);
    const usable = (window: WorkbenchWindow | undefined) =>
      window !== undefined && window.available !== false;
    /** 这一处现在显示的窗口（不可用的算收着） */
    const shownAt = (anchor: WorkbenchAnchor) => {
      const window = byId(layout!.shown[anchor]);
      return usable(window) ? window : undefined;
    };
    const isShown = (id: string) => {
      const window = byId(id);
      return window !== undefined && shownAt(window.anchor)?.id === id;
    };
    const setShown = (anchor: WorkbenchAnchor, id: string | undefined) => {
      const shown = { ...layout!.shown };
      if (id === undefined) delete shown[anchor];
      else shown[anchor] = id;
      layout = { ...layout!, shown };
    };
    const show = (id: string) => {
      const window = byId(id);
      if (window) setShown(window.anchor, id);
    };
    const hide = (id: string) => {
      const window = byId(id);
      if (window && layout!.shown[window.anchor] === id) setShown(window.anchor, undefined);
    };
    const toggle = (id: string) => (isShown(id) ? hide(id) : show(id));
    WorkbenchContext.provide({ show, hide, toggle, isShown });
    const resize = (change: Partial<Sizes>) =>
      (layout = { ...layout!, sizes: { ...layout!.sizes, ...change } });

    // 跟着正在编辑的东西出现的窗口：变得可用时显示，不可用时收起
    watch(
      () =>
        windows
          .filter((window) => window.showWhenAvailable)
          .map((window) => [window.id, usable(window)] as const),
      (now, before) => {
        const was = new Map(before ?? []);
        for (const [id, available] of now) {
          if (available && was.get(id) === false) show(id);
          else if (!available && was.get(id) === true) hide(id);
        }
      },
    );

    const stripeButton = (window: WorkbenchWindow) =>
      usable(window) && (
        <IconButton
          {...workbenchPart('stripeButton')}
          icon={window.icon}
          size="sm"
          variant={isShown(window.id) ? 'soft' : 'ghost'}
          tone="neutral"
          aria-label={window.title}
          aria-pressed={isShown(window.id)}
          title={window.title}
          onClick={() => toggle(window.id)}
        />
      );

    const frame = (window: WorkbenchWindow) => (
      <section
        {...css.attrs(workbenchStyles.window)}
        {...workbenchPart('window')}
        aria-label={window.title}
      >
        <header {...css.attrs(workbenchStyles.header)} {...workbenchPart('windowHeader')}>
          <span {...css.attrs(workbenchStyles.title)} {...workbenchPart('windowTitle')}>
            {window.title}
          </span>
          {window.detail && (
            <span
              {...css.attrs(workbenchStyles.detail)}
              {...workbenchPart('windowDetail')}
              title={window.detail}
            >
              {window.detail}
            </span>
          )}
          <span {...css.attrs(workbenchStyles.actions)} {...workbenchPart('windowActions')}>
            {window.actions?.()}
            <IconButton
              icon={Minus}
              size="sm"
              variant="ghost"
              tone="neutral"
              aria-label={lang.workbenchHide(window.title)}
              title={lang.workbenchHide(window.title)}
              onClick={() => hide(window.id)}
            />
          </span>
        </header>
        {window.scroll === 'self' ? (
          <div {...css.attrs(workbenchStyles.windowBody)} {...workbenchPart('windowBody')}>
            <div {...css.attrs(workbenchStyles.fill)}>{window.content()}</div>
          </div>
        ) : (
          <ScrollArea {...css.attrs(workbenchStyles.windowBody)} {...workbenchPart('windowBody')}>
            {window.content()}
          </ScrollArea>
        )}
      </section>
    );

    /** 一边（左或右）：上下两个都显示时分开 */
    const side = (top: WorkbenchAnchor, bottom: WorkbenchAnchor, split: keyof Sizes) => {
      const a = shownAt(top),
        b = shownAt(bottom);
      if (a && b) {
        return (
          <Splitter
            {...css.attrs(workbenchStyles.fill)}
            orientation="vertical"
            _size={layout!.sizes[split]}
            minSize={15}
            maxSize={85}
            onUpdate:_size={(size: number) => resize({ [split]: size })}
            start={frame(a)}
            end={frame(b)}
          />
        );
      }
      const only = a ?? b;
      return only && frame(only);
    };

    /** 三层分栏一直在，收起是折叠：分栏的结构一变，里面的主内容就被重建 */
    const work = () => {
      const { sizes } = layout!;
      const left = side('left', 'leftBottom', 'leftSplit');
      const right = side('right', 'rightBottom', 'rightSplit');
      const bottom = shownAt('bottom');
      const main = (
        <div {...css.attrs(workbenchStyles.fill)} {...workbenchPart('main')}>
          {children}
        </div>
      );
      const middle = (
        <Splitter
          {...css.attrs(workbenchStyles.fill)}
          _size={100 - sizes.right}
          minSize={30}
          maxSize={95}
          onUpdate:_size={(size: number) => resize({ right: 100 - size })}
          collapsible="end"
          collapseControl="external"
          _collapsed={!right}
          start={main}
          end={right}
        />
      );
      const top = (
        <Splitter
          {...css.attrs(workbenchStyles.fill)}
          _size={sizes.left}
          minSize={5}
          maxSize={60}
          onUpdate:_size={(size: number) => resize({ left: size })}
          collapsible="start"
          collapseControl="external"
          _collapsed={!left}
          start={left}
          end={middle}
        />
      );
      return (
        <Splitter
          {...css.attrs(workbenchStyles.fill)}
          orientation="vertical"
          _size={100 - sizes.bottom}
          minSize={15}
          maxSize={95}
          onUpdate:_size={(size: number) => resize({ bottom: 100 - size })}
          collapsible="end"
          collapseControl="external"
          _collapsed={!bottom}
          start={top}
          end={bottom && frame(bottom)}
        />
      );
    };

    return () => (
      <div {...mergeAttrs<'div'>({ sx: workbenchStyles.root, ...workbenchPart('root') }, rest)}>
        {header}
        <div {...css.attrs(workbenchStyles.body)} {...workbenchPart('body')}>
          <nav
            {...css.attrs(workbenchStyles.stripe, workbenchStyles.stripeStart)}
            {...workbenchPart('stripe')}
            aria-label={lang.workbenchStripeStart}
          >
            {windows
              .filter((window) => window.anchor === 'left' || window.anchor === 'leftBottom')
              .map(stripeButton)}
            <span {...css.attrs(workbenchStyles.push)} />
            {windows.filter((window) => window.anchor === 'bottom').map(stripeButton)}
          </nav>
          <div {...css.attrs(workbenchStyles.work)}>{work()}</div>
          <nav
            {...css.attrs(workbenchStyles.stripe, workbenchStyles.stripeEnd)}
            {...workbenchPart('stripe')}
            aria-label={lang.workbenchStripeEnd}
          >
            {windows
              .filter((window) => window.anchor === 'right' || window.anchor === 'rightBottom')
              .map(stripeButton)}
          </nav>
        </div>
        {footer}
      </div>
    );
  },
);
