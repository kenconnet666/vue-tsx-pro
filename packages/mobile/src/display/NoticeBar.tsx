/**
 * 通知栏：页面顶部一条浅色的公告，前面一个喇叭；文字放不下时从右往左滚动，可关闭或带箭头点进详情。
 *
 *   <NoticeBar>双十一活动 11 月 1 日开始，全场满 300 减 50</NoticeBar>
 *   <NoticeBar mode="closeable" tone="danger">账户存在风险，请尽快完善实名信息</NoticeBar>
 *   <NoticeBar wrapable>多行显示，不滚动……</NoticeBar>
 */
import { ChevronRight, Volume2, X } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onMounted, onUpdated, type VNodeChild } from 'vue';
import { Icon, type IconData } from '../base/Icon';
import { useConfig } from '../config/context';
import { useHost } from '../utils/host';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';

/** 右边的操作 */
export interface NoticeBarModes {
  /** 关闭按钮 */
  closeable: unknown;
  /** 箭头：整条可点 */
  link: unknown;
}

/** 未声明的属性落到根元素（div）上 */
export interface NoticeBarProps extends Omit<PartProps<'div', 'role'>, 'onClose'> {
  /** 文字（与 children 二选一） */
  text?: VNodeChild;
  /** 右边的操作 */
  mode?: keyof NoticeBarModes;
  /**
   * 色调
   * @default 'warning'
   */
  tone?: 'warning' | 'accent' | 'danger' | 'success';
  /**
   * 前面的图标；false 不显示
   * @default Volume2
   */
  icon?: IconData | false;
  /** 多行显示，不滚动 */
  wrapable?: boolean;
  /**
   * 滚动的速度（px/s）
   * @default 60
   */
  speed?: number;
  /** 点了关闭（关闭后不再显示） */
  onClose?: () => void;
  /** 文字 */
  children?: VNodeChild;
  /** 文字那一栏的部件属性 */
  propsContent?: PartProps<'div'>;
}

const marquee = css.keyframes({
  from: { transform: 'translateX(0)' },
  to: { transform: 'translateX(-100%)' },
});

/** NoticeBar 的样式：root、各色调、icon、viewport、text、scrolling、wrap、action */
export const noticeBarStyles = css.create({
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    minHeight: '2.6em',
    paddingBlock: '0.4em',
    paddingInline: '_lg',
    fontSize: '_sm',
    lineHeight: '1.5',
  },
  warning: { color: '_warningText', backgroundColor: '_warningSoft' },
  accent: { color: '_accentText', backgroundColor: '_accentSoft' },
  danger: { color: '_dangerText', backgroundColor: '_dangerSoft' },
  success: { color: '_successText', backgroundColor: '_successSoft' },
  icon: { flex: 'none', fontSize: '1.15em' },
  viewport: { position: 'relative', flex: '1 1 auto', minWidth: 0, overflow: 'hidden' },
  text: { display: 'inline-block', whiteSpace: 'nowrap' },
  // 滚动时：左边留出整个可视宽度（从右边进来），动画移动自己的全部宽度
  scrolling: {
    animationName: marquee,
    animationTimingFunction: 'linear',
    animationIterationCount: { default: 'infinite', _reducedMotion: 0 },
  },
  wrap: { whiteSpace: 'normal', overflowWrap: 'anywhere' },
  action: {
    flex: 'none',
    display: 'inline-flex',
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: 'inherit',
    fontSize: '1.15em',
    cursor: 'pointer',
  },
});

/** 通知栏（div[role=alert] > 图标 + 文字 + 操作） */
export const NoticeBar = _component(
  ({
    text,
    mode,
    tone = 'warning',
    icon = Volume2,
    wrapable = false,
    speed = 60,
    onClose,
    children,
    propsContent,
    ...rest
  }: NoticeBarProps) => {
    const config = useConfig();
    const host = useHost();
    let closed = _state(false);
    // 放不下时的滚动：可视宽度与文字宽度（px）
    let scroll = _state<{ viewport: number; text: number } | null>(null);
    let viewport: unknown = null;
    let content: unknown = null;
    const measure = async () => {
      // 关闭后节点已经卸掉，不再量
      if (closed) return;
      if (wrapable) return void (scroll = null);
      const [box, inner] = await Promise.all([host.measure(viewport), host.measure(content)]);
      // 滚动时文字左边加了可视宽度的内边距，量到的宽度要减掉
      const width = (inner?.width ?? 0) - (scroll?.viewport ?? 0);
      const next = box && width > box.width ? { viewport: box.width, text: width } : null;
      // 量出来没变就不赋值：否则又触发一次渲染、再量一次，停不下来
      if (next?.viewport !== scroll?.viewport || next?.text !== scroll?.text) scroll = next;
    };
    // 文字、children 换了都会重新渲染，渲染完再量（children 是插槽，不能在渲染函数外读）
    onMounted(() => void measure());
    onUpdated(() => void measure());

    return () => {
      if (closed) return null;
      const body = text ?? children;
      return (
        <div
          {...mergeAttrs<'div'>({ sx: [noticeBarStyles.root, noticeBarStyles[tone]] }, rest, {
            role: 'alert',
          })}
        >
          {icon && <Icon icon={icon} sx={noticeBarStyles.icon} />}
          <div
            {...mergeAttrs<'div'>({ sx: noticeBarStyles.viewport }, propsContent)}
            ref={(node: unknown) => (viewport = node)}
          >
            <span
              {...mergeAttrs<'span'>({
                sx: [
                  noticeBarStyles.text,
                  wrapable && noticeBarStyles.wrap,
                  scroll && noticeBarStyles.scrolling,
                ],
                style: scroll
                  ? {
                      paddingInlineStart: `${scroll.viewport}px`,
                      animationDuration: `${(scroll.viewport + scroll.text) / speed}s`,
                    }
                  : undefined,
              })}
              ref={(node: unknown) => (content = node)}
            >
              {hasContent(body) ? body : null}
            </span>
          </div>
          {mode === 'closeable' && (
            <button
              {...mergeAttrs<'button'>({ sx: noticeBarStyles.action })}
              type="button"
              aria-label={config.lang.close}
              onClick={(event: Event) => {
                event.stopPropagation();
                closed = true;
                onClose?.();
              }}
            >
              <Icon icon={X} />
            </button>
          )}
          {mode === 'link' && <Icon icon={ChevronRight} sx={noticeBarStyles.icon} />}
        </div>
      );
    };
  },
);
