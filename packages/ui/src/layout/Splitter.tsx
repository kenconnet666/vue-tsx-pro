/**
 * 分栏：两栏并排（或上下），中间的分隔条可以拖动调整比例，一侧可以收起。收件箱（左列表、右预览）、
 * 主从视图、编辑器与预览这类“两块都要看、比例因人而异”的布局。
 *
 *   <Splitter _size={listSize} collapsible="end" _collapsed={previewHidden}
 *     start={<List />} end={<Preview />} />
 *
 * size 是起始一栏占的百分比（父级写 _bind 记住），拖动时夹在 minSize–maxSize 之间；双击分隔条回到初始比例。
 * 分隔条按 WAI-ARIA 的 Window Splitter 模式：role="separator"、可聚焦，←/→（上下排列时 ↑/↓）每次调 5%，
 * Home / End 到最小 / 最大，Enter 收起或展开可收起的那一侧；从右到左排版下左右键自动镜像。
 * 写了 collapsible 时分隔条中间有收起、展开的小按钮；收起的一栏不显示（hidden），另一栏占满。
 * 两栏各自滚动，用浮层滚动条（ScrollArea，和整页、侧栏一样）；内容的高度可以写 100% 铺满一栏。
 */
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { useId, type VNodeChild } from 'vue';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import { t } from '../config/theme/tokens';
import { clamp } from '../utils/data/number';
import { inlineArrows, isRtl } from '../utils/dom/direction';
import { startMove } from '../utils/dom/move';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { ScrollArea, type ScrollAreaProps } from './ScrollArea';
import { partAttrs } from '../config/styles';

/** 两栏的排法 */
export interface SplitterOrientations {
  /** 左右并排（默认） */
  horizontal: unknown;
  /** 上下排列 */
  vertical: unknown;
}

/** 未声明的属性落到外层 div 上 */
export interface SplitterProps extends PartProps<'div'> {
  /** 起始一栏（左或上）的内容 */
  start: VNodeChild;
  /** 结束一栏（右或下）的内容 */
  end: VNodeChild;
  /**
   * 两栏的排法
   * @default 'horizontal'
   */
  orientation?: keyof SplitterOrientations;
  /**
   * 起始一栏占的百分比：父级写 _size={x} 记住拖动后的比例
   * @default 50
   */
  _size?: number;
  /**
   * 起始一栏最少占多少（百分比）
   * @default 20
   */
  minSize?: number;
  /**
   * 起始一栏最多占多少（百分比）
   * @default 80
   */
  maxSize?: number;
  /** 哪一侧可以收起；不写时不能收起 */
  collapsible?: 'start' | 'end';
  /** 可收起的那一侧收着：父级写 _collapsed={x} */
  _collapsed?: boolean;
  /** 分隔条的名称（读屏），默认取语言包（调整分栏） */
  label?: string;
  /** 外面一圈边框、圆角与表面色：独立成块（收件箱的列表与预览） */
  bordered?: boolean;
  /** 起始一栏（div）的部件属性 */
  propsStart?: PartProps<'div'>;
  /** 结束一栏（div）的部件属性 */
  propsEnd?: PartProps<'div'>;
  /** 两栏里滚动区域（ScrollArea）的部件属性 */
  propsScroll?: Partial<ScrollAreaProps>;
  /** 分隔条（div，role="separator"）的部件属性 */
  propsHandle?: PartProps<'div'>;
  /** 收起、展开按钮的部件属性 */
  propsToggle?: Partial<IconButtonProps>;
}

/** 键盘每按一次调多少（百分比） */
const STEP = 5;

/** 部件的标记（data-scope="splitter"） */
const splitterPart = (part: string) => partAttrs({ name: 'Splitter' }, part);

/** Splitter 的样式：root、pane、handle、line、toggle… */
const splitterStyles = css.create({
  root: { display: 'grid', minWidth: 0, minHeight: 0, height: '100%' },
  bordered: {
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_lg',
    backgroundColor: '_surface',
    overflow: 'hidden',
  },
  pane: { minWidth: 0, minHeight: 0, overflow: 'hidden' },
  paneScroll: { height: '_full' },
  // 内容层和这一栏一样高：里面的表格、空状态写 100% 才有依据
  paneContent: { height: '_full' },
  // 分隔条所在的格：分隔条铺满它，收起按钮叠在中间（不放进可聚焦的分隔条里：交互元素不能嵌套）
  track: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  // 分隔条：看得见的是中间一条细线，能拖的范围更宽。悬停、拖动时线加粗变深，键盘聚焦时加粗变成强调色
  // （同 ResizeHandle）；线的粗细经变量交给里面的线（线看不到分隔条的悬停）
  handle: {
    position: 'absolute',
    inset: 0,
    touchAction: 'none',
    outlineStyle: 'none',
    color: {
      default: '_borderMuted',
      _hover: '_borderStrong',
      _dragging: '_borderStrong',
      _focusVisible: '_accent',
    },
    '--splitter-line': {
      default: t.borderWidths.xs,
      _hover: t.borderWidths.md,
      _dragging: t.borderWidths.md,
      _focusVisible: t.borderWidths.md,
    },
  },
  handleHorizontal: { width: '_space.md', cursor: 'col-resize' },
  handleVertical: { height: '_space.md', cursor: 'row-resize' },
  line: {
    position: 'absolute',
    backgroundColor: 'currentColor',
    pointerEvents: 'none',
    transition: `width ${t.durations.sm} ${t.easings.standard}, height ${t.durations.sm} ${t.easings.standard}, inset ${t.durations.sm} ${t.easings.standard}`,
  },
  // 线宽取分隔条给的变量（平时是主题的边框宽度），减去一半居中
  lineHorizontal: {
    insetBlock: 0,
    insetInlineStart: 'calc(50% - var(--splitter-line) / 2)',
    width: 'var(--splitter-line)',
  },
  lineVertical: {
    insetInline: 0,
    top: 'calc(50% - var(--splitter-line) / 2)',
    height: 'var(--splitter-line)',
  },
  // 收起、展开的小按钮压在线上：背景盖住线
  // 收起按钮叠在分隔线上，要不透明的底遮住线；悬停换成同样不透明的填充色（原来的实底盖掉了描边按钮的悬停）
  toggle: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: { default: '_surface', _hover: '_fillHover' },
    cursor: 'pointer',
  },
});

/** Splitter 的动态样式：两栏与分隔条的轨道 */
const splitterDynamicStyles = css.create({
  columns: (template: string) => ({ gridTemplateColumns: template }),
  rows: (template: string) => ({ gridTemplateRows: template }),
});

/** 分栏 */
export const Splitter = _component(
  ({
    start,
    end,
    orientation = 'horizontal',
    _size: size = _bindable(50),
    minSize = 20,
    maxSize = 80,
    collapsible,
    _collapsed: collapsed = _bindable(false),
    label,
    bordered = false,
    propsStart,
    propsEnd,
    propsScroll,
    propsHandle,
    propsToggle,
    ...rest
  }: SplitterProps) => {
    const lang = useLang();
    const id = useId();
    const initialSize = _untrack(size);
    let root = _state.raw<HTMLElement | null>(null);
    const horizontal = () => orientation === 'horizontal';
    const fit = (value: number) => Math.round(clamp(value, minSize, maxSize) * 10) / 10;

    // 拖动中：指针离开了分隔条也保持加粗变深
    let dragging = _state(false);

    function onPointerdown(event: PointerEvent) {
      if (!root || (event.target as Element).closest('button')) return;
      const rect = root.getBoundingClientRect();
      const total = horizontal() ? rect.width : rect.height;
      const from = size;
      const sign = horizontal() && isRtl(root) ? -1 : 1;
      event.preventDefault();
      dragging = true;
      startMove(event, {
        onMove: ({ deltaX, deltaY }) => {
          const delta = (horizontal() ? deltaX * sign : deltaY) / total;
          size = fit(from + delta * 100);
          // 拖动即展开：收着的一侧被拖出来
          if (collapsed) collapsed = false;
        },
        onEnd: () => (dragging = false),
      });
    }

    function onKeydown(event: KeyboardEvent) {
      if (event.key === 'Enter' && collapsible) {
        event.preventDefault();
        collapsed = !collapsed;
        return;
      }
      const { forward, backward } = horizontal()
        ? inlineArrows(root ? isRtl(root) : false)
        : { forward: 'ArrowDown', backward: 'ArrowUp' };
      const next =
        event.key === forward
          ? size + STEP
          : event.key === backward
            ? size - STEP
            : event.key === 'Home'
              ? minSize
              : event.key === 'End'
                ? maxSize
                : null;
      if (next == null) return;
      event.preventDefault();
      size = fit(next);
      if (collapsed) collapsed = false;
    }

    /** 收起、展开按钮的箭头：指向收起的方向 */
    const toggleIcon = () => {
      const towardStart = (collapsible === 'start') !== collapsed;
      if (horizontal()) return towardStart ? ChevronLeft : ChevronRight;
      return towardStart ? ChevronUp : ChevronDown;
    };

    /** 一栏的内容：放进浮层滚动条的滚动区域 */
    const pane = (content: VNodeChild) => (
      <ScrollArea
        {...mergePartProps<ScrollAreaProps>(
          {
            axis: 'both',
            sx: splitterStyles.paneScroll,
            propsContent: { sx: splitterStyles.paneContent },
          },
          propsScroll,
        )}
      >
        {content}
      </ScrollArea>
    );

    return () => {
      const hideStart = collapsed && collapsible === 'start';
      const hideEnd = collapsed && collapsible === 'end';
      const template = hideStart
        ? '0 auto minmax(0, 1fr)'
        : hideEnd
          ? 'minmax(0, 1fr) auto 0'
          : `minmax(0, ${size}fr) auto minmax(0, ${100 - size}fr)`;
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                splitterStyles.root,
                bordered && splitterStyles.bordered,
                horizontal()
                  ? splitterDynamicStyles.columns(template)
                  : splitterDynamicStyles.rows(template),
              ],
              ...splitterPart('root'),
            },
            rest,
            { ref: (element: unknown) => (root = element as HTMLElement | null) },
          )}
          data-orientation={orientation}
          data-collapsed={collapsed ? collapsible : undefined}
        >
          <div
            {...mergeAttrs<'div'>(
              { sx: splitterStyles.pane, ...splitterPart('start') },
              propsStart,
              {
                id: `${id}-start`,
                hidden: hideStart || undefined,
              },
            )}
          >
            {pane(start)}
          </div>
          <div
            {...css.attrs(
              splitterStyles.track,
              horizontal() ? splitterStyles.handleHorizontal : splitterStyles.handleVertical,
            )}
            {...splitterPart('track')}
          >
            <div
              {...mergeAttrs<'div'>(
                {
                  sx: [
                    splitterStyles.handle,
                    horizontal() ? splitterStyles.handleHorizontal : splitterStyles.handleVertical,
                  ],
                  ...splitterPart('handle'),
                },
                propsHandle,
                {
                  role: 'separator',
                  tabindex: 0,
                  'aria-label': label ?? lang.splitterResize,
                  'aria-orientation': horizontal() ? 'vertical' : 'horizontal',
                  'aria-controls': `${id}-start`,
                  'aria-valuenow': hideStart ? 0 : hideEnd ? 100 : size,
                  'aria-valuemin': minSize,
                  'aria-valuemax': maxSize,
                  onPointerdown,
                  onKeydown,
                  onDblclick: () => (size = fit(initialSize)),
                },
              )}
              data-dragging={dragging || undefined}
            >
              <span
                {...css.attrs(
                  splitterStyles.line,
                  horizontal() ? splitterStyles.lineHorizontal : splitterStyles.lineVertical,
                )}
                {...splitterPart('line')}
              />
            </div>
            {collapsible && (
              <IconButton
                {...mergePartProps<IconButtonProps>(
                  {
                    icon: toggleIcon(),
                    size: 'xs',
                    variant: 'outline',
                    tone: 'neutral',
                    sx: splitterStyles.toggle,
                    'aria-label': collapsed ? lang.splitterExpand : lang.splitterCollapse,
                  },
                  propsToggle,
                  {
                    'aria-expanded': !collapsed,
                    'aria-controls': collapsible === 'start' ? `${id}-start` : `${id}-end`,
                    // 键盘用户在分隔条上按 Enter：按钮不进 Tab 顺序，免得多停一次
                    tabindex: -1,
                    onClick: () => (collapsed = !collapsed),
                  },
                )}
              />
            )}
          </div>
          <div
            {...mergeAttrs<'div'>({ sx: splitterStyles.pane, ...splitterPart('end') }, propsEnd, {
              id: `${id}-end`,
              hidden: hideEnd || undefined,
            })}
          >
            {pane(end)}
          </div>
        </div>
      );
    };
  },
);
