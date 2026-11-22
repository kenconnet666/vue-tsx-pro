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
 *   同一处一次只显示一个，显示另一个时原来的让开；窗口挪走后空出来的那一处换回停在那里的另一个，挪到一边的下面而上面空着时
 *   上面的也显示出来（不然它独占一整边，看不出在下面）。左侧竖条的上面一组是左边的窗口，下面一组是停在下边的；右侧竖条是右边的。
 * - 主内容一直在：几层分栏一直都在，收起一边是把那一栏折叠起来——画布、iframe、视频不会因为开关工具窗口被重建。
 * - 布局（显示哪些、各占多大）是 _layout，父级双向绑定；要记住时配 usePersistentState（见上面的例子）。
 * - available 是 false 的窗口（跟着正在编辑的东西出现的：时间轴、调试）不显示、竖条上也没有它；showWhenAvailable 时它变得
 *   可用就自动显示，不可用时自动收起。
 * - 工具窗口的标题栏：名字、detail（补充说明，比如打开的文件）、actions（这个窗口自己的按钮）、收起按钮。内容默认放进
 *   ScrollArea；scroll 是 self 时铺满、自己管滚动（树、表格、画布）。
 * - 挪窗口（同 JetBrains）：把竖条上的按钮拖到另一处（左侧竖条的上面一组是左边、下面一组是下边，右侧竖条是右边），或者用
 *   标题栏的菜单"移到"（五处都能选）；挪过的记在布局的 anchors 里。菜单里还能"浮动"：窗口浮在工作区上面，拖标题栏挪、拖左右
 *   下三条边和下面两个角改大小（记在布局的 floating 里），"停靠"放回原处。
 * - 子组件经 WorkbenchContext 拿到 show / hide / toggle / moveTo / float / dock，在别处打开某个工具窗口（"在属性面板里查看"）。
 *
 * 部件（data-scope="workbench"）：Root、Body、Stripe（两侧的竖条）、StripeButton、Main（主内容）、Window（工具窗口）、
 * WindowHeader、WindowTitle、WindowDetail、WindowActions、WindowBody。
 */
import { _component, createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Ellipsis, Minus } from '@lucide/icons';
import { watch, type VNodeChild } from 'vue';
import type { IconData } from '../base/Icon';
import { IconButton } from '../base/IconButton';
import { Menu, MenuGroup, MenuItem } from '../overlay/Menu';
import { startMove } from '../utils/dom/move';
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

/** 浮动的工具窗口：在工作区里的位置、大小（px，相对工作区的左上角），开没开着 */
export interface WorkbenchFloat {
  /** 左边（px） */
  readonly x: number;
  /** 上边（px） */
  readonly y: number;
  /** 宽（px） */
  readonly width: number;
  /** 高（px） */
  readonly height: number;
  /** 开着；收起时 false（位置、大小留着，下次照样） */
  readonly open: boolean;
}

/** 布局：每一处显示的窗口和各块的大小（百分比），挪过的、浮动的窗口 */
export interface WorkbenchLayout {
  /** 每一处显示的窗口的 id；没写的是收着 */
  readonly shown: Readonly<Partial<Record<WorkbenchAnchor, string>>>;
  /** 挪过的窗口停在哪（拖竖条上的按钮、标题栏的"移到"）；没写的按窗口自己的 anchor */
  readonly anchors?: Readonly<Record<string, WorkbenchAnchor>>;
  /** 浮动的窗口（标题栏的"浮动"）：不在任何一处，浮在工作区上面 */
  readonly floating?: Readonly<Record<string, WorkbenchFloat>>;
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
  /** 停到另一处并显示（不再浮动） */
  moveTo(id: string, anchor: WorkbenchAnchor): void;
  /** 浮动并显示 */
  float(id: string): void;
  /** 浮动的放回它停的那一处并显示 */
  dock(id: string): void;
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
  // 竖条上的一组按钮：拖按钮进来就停到这一处；拖着经过时高亮
  group: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    width: '_full',
  },
  groupFill: { flex: 1 },
  groupEnd: { minHeight: '2.5rem', justifyContent: 'flex-end' },
  dropTarget: { backgroundColor: '_accentSoft', borderRadius: '_sm' },
  floatLayer: { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 },
  float: {
    position: 'absolute',
    pointerEvents: 'auto',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    overflow: 'hidden',
    boxShadow: '_lg',
  },
  floatHeader: { cursor: 'move', touchAction: 'none' },
  // 改大小的把手：左、右、下三条边和下面两个角（上边是标题栏，拖它挪窗口）；边是细条，角盖在边上面
  resize: { position: 'absolute', touchAction: 'none', zIndex: 1 },
  resizeLeft: { left: 0, top: 0, bottom: 0, width: '6px', cursor: 'ew-resize' },
  resizeRight: { right: 0, top: 0, bottom: 0, width: '6px', cursor: 'ew-resize' },
  resizeBottom: { left: 0, right: 0, bottom: 0, height: '6px', cursor: 'ns-resize' },
  resizeBottomLeft: {
    left: 0,
    bottom: 0,
    width: '12px',
    height: '12px',
    cursor: 'nesw-resize',
    zIndex: 2,
  },
  resizeBottomRight: {
    right: 0,
    bottom: 0,
    width: '12px',
    height: '12px',
    cursor: 'nwse-resize',
    zIndex: 2,
  },
});

/** 浮动窗口改大小的把手：拖哪几条边（左、右、下） */
const FLOAT_EDGES = {
  left: { left: true },
  right: { right: true },
  bottom: { bottom: true },
  bottomLeft: { left: true, bottom: true },
  bottomRight: { right: true, bottom: true },
} as const satisfies Record<string, { left?: true; right?: true; bottom?: true }>;
type FloatEdge = keyof typeof FLOAT_EDGES;
const FLOAT_EDGE_STYLES = {
  left: workbenchStyles.resizeLeft,
  right: workbenchStyles.resizeRight,
  bottom: workbenchStyles.resizeBottom,
  bottomLeft: workbenchStyles.resizeBottomLeft,
  bottomRight: workbenchStyles.resizeBottomRight,
} as const;

/** 竖条的按钮拖动时 dataTransfer 里的种类（只认自己拖的） */
const DRAG_TYPE = 'application/x-workbench-window';
/** 新浮动的窗口的位置和大小（px） */
const FLOAT_DEFAULT = { x: 48, y: 48, width: 420, height: 320 };
/** 浮动窗口最小的大小（px） */
const FLOAT_MIN = 160;
const ANCHORS: readonly WorkbenchAnchor[] = [
  'left',
  'leftBottom',
  'right',
  'rightBottom',
  'bottom',
];

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
    /** 窗口停在哪：挪过的按布局，没挪过的按它自己的 anchor */
    const anchorOf = (window: WorkbenchWindow) => layout!.anchors?.[window.id] ?? window.anchor;
    const floatOf = (id: string) => layout!.floating?.[id];
    /** 这一处现在显示的窗口（不可用的、浮动的、挪走了的算收着） */
    const shownAt = (anchor: WorkbenchAnchor) => {
      const window = byId(layout!.shown[anchor]);
      return usable(window) && !floatOf(window!.id) && anchorOf(window!) === anchor
        ? window
        : undefined;
    };
    const isShown = (id: string) => {
      const window = byId(id);
      if (!usable(window)) return false;
      const floating = floatOf(id);
      return floating ? floating.open : shownAt(anchorOf(window!))?.id === id;
    };
    const setFloat = (id: string, value: WorkbenchFloat | undefined) => {
      const floating = { ...layout!.floating };
      if (value === undefined) delete floating[id];
      else floating[id] = value;
      layout = { ...layout!, floating };
    };
    const setShown = (anchor: WorkbenchAnchor, id: string | undefined) => {
      const shown = { ...layout!.shown };
      if (id === undefined) delete shown[anchor];
      else shown[anchor] = id;
      layout = { ...layout!, shown };
    };
    const show = (id: string) => {
      const window = byId(id);
      if (!window) return;
      const floating = floatOf(id);
      if (floating) setFloat(id, { ...floating, open: true });
      else setShown(anchorOf(window), id);
    };
    const hide = (id: string) => {
      const window = byId(id);
      if (!window) return;
      const floating = floatOf(id);
      if (floating) setFloat(id, { ...floating, open: false });
      else if (layout!.shown[anchorOf(window)] === id) setShown(anchorOf(window), undefined);
    };
    const toggle = (id: string) => (isShown(id) ? hide(id) : show(id));
    const moveTo = (id: string, anchor: WorkbenchAnchor) => {
      const window = byId(id);
      if (!window) return;
      const shown = { ...layout!.shown };
      const from = anchorOf(window);
      const vacated = shown[from] === id && from !== anchor;
      if (vacated) delete shown[from];
      shown[anchor] = id;
      const floating = { ...layout!.floating };
      delete floating[id];
      const anchors = { ...layout!.anchors, [id]: anchor };
      /** 一处空着时显示停在那里的另一个窗口（挪走前被它顶掉的那个） */
      const refill = (at: WorkbenchAnchor) => {
        if (shown[at] !== undefined) return;
        const other = windows.find(
          (w) => w.id !== id && usable(w) && !floating[w.id] && (anchors[w.id] ?? w.anchor) === at,
        );
        if (other) shown[at] = other.id;
      };
      // 原来那一处显示的是它：空出来以后换上那里的另一个，不留一块空着
      if (vacated) refill(from);
      // 挪到一边的下面而上面空着时，上面的也显示出来：不然它独占一整边，看不出是在“下面”
      if (anchor === 'leftBottom') refill('left');
      if (anchor === 'rightBottom') refill('right');
      layout = { ...layout!, shown, floating, anchors };
    };
    const float = (id: string) => {
      const window = byId(id);
      if (!window) return;
      if (layout!.shown[anchorOf(window)] === id) setShown(anchorOf(window), undefined);
      setFloat(id, { ...FLOAT_DEFAULT, ...floatOf(id), open: true });
    };
    const dock = (id: string) => {
      const window = byId(id);
      if (window) moveTo(id, anchorOf(window));
    };
    WorkbenchContext.provide({ show, hide, toggle, isShown, moveTo, float, dock });
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
          draggable="true"
          onDragstart={(event: DragEvent) => {
            event.dataTransfer?.setData(DRAG_TYPE, window.id);
            if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
          }}
          onClick={() => toggle(window.id)}
        />
      );
    /** 拖着按钮经过的那一组（高亮） */
    let dropOver = _state<WorkbenchAnchor | undefined>(undefined);
    /** 竖条上的一组：停在 anchors 里的窗口的按钮；拖按钮进来就停到 drop 那一处 */
    const group = (anchors: readonly WorkbenchAnchor[], drop: WorkbenchAnchor, sx: object) => (
      <div
        {...css.attrs(
          workbenchStyles.group,
          sx as never,
          dropOver === drop && workbenchStyles.dropTarget,
        )}
        onDragover={(event: DragEvent) => {
          if (!event.dataTransfer?.types.includes(DRAG_TYPE)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          dropOver = drop;
        }}
        onDragleave={() => (dropOver = undefined)}
        onDrop={(event: DragEvent) => {
          dropOver = undefined;
          const id = event.dataTransfer?.getData(DRAG_TYPE);
          if (!id) return;
          event.preventDefault();
          const window = byId(id);
          // 拖回同一组（左边的上下两处算一组）不动
          if (window && !anchors.includes(anchorOf(window))) moveTo(id, drop);
        }}
      >
        {windows.filter((window) => anchors.includes(anchorOf(window))).map(stripeButton)}
      </div>
    );

    // 按窗口 id 加 key：一处换了窗口时整个框（标题栏的菜单、内容）换新的，不复用上一个窗口的组件
    const frame = (window: WorkbenchWindow, header?: (event: PointerEvent) => void) => (
      <section
        key={window.id}
        {...css.attrs(workbenchStyles.window)}
        {...workbenchPart('window')}
        aria-label={window.title}
      >
        <header
          {...css.attrs(workbenchStyles.header, header && workbenchStyles.floatHeader)}
          {...workbenchPart('windowHeader')}
          {...(header ? { onPointerdown: header } : {})}
        >
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
            <Menu
              trigger={(props) => (
                <IconButton
                  {...props}
                  icon={Ellipsis}
                  size="sm"
                  variant="ghost"
                  tone="neutral"
                  aria-label={lang.workbenchOptions(window.title)}
                  title={lang.workbenchOptions(window.title)}
                />
              )}
            >
              <MenuGroup label={lang.workbenchMoveTo}>
                {ANCHORS.map((anchor) => (
                  <MenuItem onAction={() => moveTo(window.id, anchor)}>
                    {lang.workbenchAnchors[anchor]}
                  </MenuItem>
                ))}
              </MenuGroup>
              {floatOf(window.id) ? (
                <MenuItem onAction={() => dock(window.id)}>{lang.workbenchDock}</MenuItem>
              ) : (
                <MenuItem onAction={() => float(window.id)}>{lang.workbenchFloat}</MenuItem>
              )}
            </Menu>
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

    /** 浮动窗口所在的层（盖满工作区）：拖动、改大小不出它的边 */
    let floatLayer: HTMLElement | null = null;
    /** 浮动的窗口：拖标题栏（按钮以外）挪，拖左、右、下边和下面两个角改大小；放在工作区里，画的时候和拖的时候都不超出工作区 */
    const floats = () =>
      windows
        .filter((window) => usable(window) && floatOf(window.id)?.open)
        .map((window) => {
          const rect = floatOf(window.id)!;
          /** edge 不写是挪窗口，写了是拖那几条边改大小 */
          const drag = (event: PointerEvent, edge?: FloatEdge) => {
            if (!edge && (event.target as Element).closest('button')) return;
            const stored = floatOf(window.id)!;
            // 层还没排版（大小是 0，比如测试环境）时不限
            const bounds = floatLayer?.getBoundingClientRect();
            const maxX = bounds?.width || Infinity,
              maxY = bounds?.height || Infinity;
            // 从画出来的大小开始（收进工作区的窗口比记下的小）
            const start = {
              ...stored,
              width: Math.min(stored.width, maxX - stored.x),
              height: Math.min(stored.height, maxY - stored.y),
            };
            const sides: { left?: true; right?: true; bottom?: true } = edge
              ? FLOAT_EDGES[edge]
              : {};
            const resized = (deltaX: number, deltaY: number): WorkbenchFloat => {
              let { x, width, height } = start;
              if (sides.left) {
                // 左边往里拖到最小宽度为止、往外拖到工作区的左边为止，右边不动
                x = Math.max(0, Math.min(start.x + deltaX, start.x + start.width - FLOAT_MIN));
                width = start.width + start.x - x;
              }
              if (sides.right)
                width = Math.max(FLOAT_MIN, Math.min(start.width + deltaX, maxX - start.x));
              if (sides.bottom)
                height = Math.max(FLOAT_MIN, Math.min(start.height + deltaY, maxY - start.y));
              return { ...start, x, width, height };
            };
            startMove(event, {
              threshold: edge ? 0 : 3,
              onMove: ({ deltaX, deltaY }) =>
                setFloat(
                  window.id,
                  edge
                    ? resized(deltaX, deltaY)
                    : {
                        ...start,
                        x: Math.max(0, Math.min(start.x + deltaX, maxX - start.width)),
                        y: Math.max(0, Math.min(start.y + deltaY, maxY - start.height)),
                      },
                ),
            });
          };
          return (
            <div
              key={window.id}
              {...css.attrs(workbenchStyles.float)}
              {...workbenchPart('float')}
              style={{
                left: `${rect.x}px`,
                top: `${rect.y}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                // 工作区比记下的大小小（新浮动的默认大小、工作台变小了）时收进工作区，右边、下边的把手总能拖到
                maxWidth: `calc(100% - ${rect.x}px)`,
                maxHeight: `calc(100% - ${rect.y}px)`,
              }}
            >
              {frame(window, (event) => drag(event))}
              {(Object.keys(FLOAT_EDGES) as FloatEdge[]).map((edge) => (
                <div
                  key={edge}
                  {...css.attrs(workbenchStyles.resize, FLOAT_EDGE_STYLES[edge])}
                  aria-hidden="true"
                  data-edge={edge}
                  onPointerdown={(event: PointerEvent) => drag(event, edge)}
                />
              ))}
            </div>
          );
        });

    return () => (
      <div {...mergeAttrs<'div'>({ sx: workbenchStyles.root, ...workbenchPart('root') }, rest)}>
        {header}
        <div {...css.attrs(workbenchStyles.body)} {...workbenchPart('body')}>
          <nav
            {...css.attrs(workbenchStyles.stripe, workbenchStyles.stripeStart)}
            {...workbenchPart('stripe')}
            aria-label={lang.workbenchStripeStart}
          >
            {group(['left', 'leftBottom'], 'left', workbenchStyles.groupFill)}
            {group(['bottom'], 'bottom', workbenchStyles.groupEnd)}
          </nav>
          <div {...css.attrs(workbenchStyles.work)}>
            {work()}
            <div
              ref={(element: unknown) => (floatLayer = element as HTMLElement | null)}
              {...css.attrs(workbenchStyles.floatLayer)}
            >
              {floats()}
            </div>
          </div>
          <nav
            {...css.attrs(workbenchStyles.stripe, workbenchStyles.stripeEnd)}
            {...workbenchPart('stripe')}
            aria-label={lang.workbenchStripeEnd}
          >
            {group(['right', 'rightBottom'], 'right', workbenchStyles.groupFill)}
          </nav>
        </div>
        {footer}
      </div>
    );
  },
);
