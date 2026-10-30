/**
 * 索引栏：按首字母分组的长列表（城市、通讯录），右边一列字母，点或在上面滑动跳到那一组，各组的标题滚到顶部时吸住。
 *
 *   <IndexBar>
 *     <IndexAnchor index="A" />
 *     <Cell title="安庆" />
 *     <IndexAnchor index="B" />
 *     <Cell title="北京" />
 *   </IndexBar>
 *
 * 跳转与当前组都按页面滚动算：各组标题的位置在挂上时量一次（宿主的异步测量），之后滚动只比较数字。
 */
import { _component, createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { nextTick, onBeforeUnmount, onMounted, shallowReactive, watch, type VNodeChild } from 'vue';
import { useHost, type HostRect } from '../utils/host';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';

/** 一组的标题登记给索引栏的 */
interface AnchorEntry {
  readonly index: string;
  element: unknown;
}

/** 索引栏提供给各组标题的 */
interface IndexBarState {
  readonly active: string | undefined;
  readonly stickyOffsetTop: string;
  register(entry: AnchorEntry): () => void;
}

const IndexBarContext = createContext<IndexBarState>('IndexBar');

/** 未声明的属性落到根元素（div）上 */
export interface IndexBarProps extends Omit<PartProps<'div'>, 'onSelect'> {
  /**
   * 组标题吸住时离顶部多远（CSS 长度；页面顶部有固定的导航栏时写它的高度）
   * @default '0px'
   */
  stickyOffsetTop?: string;
  /** 点（或滑到）右边的一个字母 */
  onSelect?: (index: string) => void;
  /** 各组的 IndexAnchor 与内容 */
  children?: VNodeChild;
  /** 右边字母栏的部件属性 */
  propsSidebar?: PartProps<'div'>;
}

/** IndexBar、IndexAnchor 的样式 */
export const indexBarStyles = css.create({
  sidebar: {
    position: 'fixed',
    insetInlineEnd: 0,
    insetBlockStart: '50%',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingInline: '0.3em',
    transform: 'translateY(-50%)',
    userSelect: 'none',
  },
  letter: {
    paddingBlock: '0.1em',
    paddingInline: '0.4em',
    fontSize: '0.7em',
    fontWeight: '_medium',
    lineHeight: '1.4',
    color: { default: '_textMuted', '[data-active]': '_accentText' },
  },
  anchor: {
    position: 'sticky',
    zIndex: 1,
    paddingBlock: '0.3em',
    paddingInline: '_lg',
    fontSize: '_sm',
    fontWeight: '_semibold',
    color: { default: '_textMuted', '[data-active]': '_accentText' },
    backgroundColor: { default: '_background', '[data-active]': '_surface' },
  },
});

/** 索引栏（div > 内容 + 右边的字母栏） */
export const IndexBar = _component(
  ({ stickyOffsetTop = '0px', onSelect, children, propsSidebar, ...rest }: IndexBarProps) => {
    const host = useHost();
    const anchors = shallowReactive<AnchorEntry[]>([]);
    let active = _state<string | undefined>(undefined);
    // 各组标题在页面里的位置（px，相对页面顶部），挂上时与组变化时量
    let offsets: { index: string; top: number }[] = [];
    const measureAnchors = async () => {
      const scrollTop = host.scrollTop();
      const rects = await Promise.all(anchors.map((anchor) => host.measure(anchor.element)));
      offsets = anchors
        .map((anchor, position) => ({
          index: anchor.index,
          top: (rects[position]?.top ?? 0) + scrollTop,
        }))
        .sort((a, b) => a.top - b.top);
      update(host.scrollTop());
    };
    /** 当前的组：页面顶部已经越过的最后一个标题（留几像素的余量） */
    const update = (scrollTop: number) => {
      let current = offsets[0]?.index;
      for (const offset of offsets) if (offset.top <= scrollTop + 4) current = offset.index;
      active = current;
    };
    onMounted(() => void nextTick(measureAnchors));
    watch(
      () => anchors.length,
      () => void nextTick(measureAnchors),
    );
    const stop = host.onScroll(update);
    onBeforeUnmount(stop);

    IndexBarContext.provide({
      get active() {
        return active;
      },
      get stickyOffsetTop() {
        return stickyOffsetTop;
      },
      register(entry) {
        anchors.push(entry);
        return () => anchors.splice(anchors.indexOf(entry), 1);
      },
    });

    // 跳到一组：按挂上时量的位置（吸住的标题量出来是吸住的位置，不是这一组开始的地方）
    const jump = (index: string) => {
      const offset = offsets.find((item) => item.index === index);
      if (!offset) return;
      onSelect?.(index);
      host.scrollTo(offset.top);
      active = index;
    };

    // 在字母栏上滑动：按下时量各字母的位置，移动时按纵坐标找字母
    let letters: unknown[] = [];
    let letterRects: (HostRect | null)[] = [];
    let last: string | undefined;
    const letterAt = (y: number) =>
      anchors[
        letterRects.findIndex(
          (rect) => rect !== null && y >= rect.top && y < rect.top + rect.height,
        )
      ]?.index;
    const onTouchstart = () => {
      last = undefined;
      void Promise.all(letters.slice(0, anchors.length).map((letter) => host.measure(letter))).then(
        (rects) => (letterRects = rects),
      );
    };
    const onTouchmove = (event: TouchEvent) => {
      const index = letterAt(event.touches[0]!.clientY);
      if (index && index !== last) jump((last = index));
    };

    return () => (
      <div {...mergeAttrs<'div'>({}, rest)}>
        {children}
        <div
          {...mergeAttrs<'div'>({ sx: indexBarStyles.sidebar }, propsSidebar, {
            onTouchstart,
            onTouchmove,
            // 小程序：在字母栏上滑动时页面不跟着滚
            ...dataAttrs({ 'data-touch-move': 'catch' }),
          })}
        >
          {anchors.map((anchor, position) => (
            <span
              {...mergeAttrs<'span'>(
                { sx: indexBarStyles.letter },
                {
                  role: 'button',
                  'aria-label': anchor.index,
                  onClick: () => jump(anchor.index),
                  ...dataAttrs({ 'data-active': anchor.index === active }),
                },
              )}
              ref={(node: unknown) => (letters[position] = node)}
            >
              {anchor.index}
            </span>
          ))}
        </div>
      </div>
    );
  },
);

/** 未声明的属性落到标题（div）上 */
export interface IndexAnchorProps extends PartProps<'div'> {
  /** 这一组的字母（也是右边字母栏上的字） */
  index: string;
  /** 标题的内容；不给时显示 index */
  children?: VNodeChild;
}

/** 一组的标题（div，吸顶） */
export const IndexAnchor = _component(({ index, children, ...rest }: IndexAnchorProps) => {
  const bar = IndexBarContext.inject();
  const entry: AnchorEntry = {
    get index() {
      return index;
    },
    element: null,
  };
  onBeforeUnmount(bar.register(entry));
  return () => (
    <div
      {...mergeAttrs<'div'>(
        { sx: indexBarStyles.anchor, style: { insetBlockStart: bar.stickyOffsetTop } },
        rest,
        dataAttrs({ 'data-active': bar.active === index }),
      )}
      ref={(node: unknown) => (entry.element = node)}
    >
      {children ?? index}
    </div>
  );
});
