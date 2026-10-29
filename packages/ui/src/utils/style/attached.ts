/**
 * 相连的一组控件：几个按钮（ButtonGroup）或输入框与按钮（ControlGroup，如“币种 + 金额 + 查询”）连成一条，
 * 相邻一侧不要圆角、边框叠在一起。组经 AttachedContext 告诉里面的控件排列方向，控件把 attachedStyles 加到自己的外壳上。
 * 外壳要是组的直接子元素。判断首尾时跳过不占位的兄弟（选择框的弹出面板、表单的隐藏 input），
 * 用 :nth-child(1 of …)（各浏览器 2023 年起支持）。
 */
import { createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { t } from '../../config/theme/tokens';

/** 相连的方向 */
export interface AttachedOrientations {
  /** 横排（默认）：去掉左右相邻一侧的圆角 */
  horizontal: unknown;
  /** 竖排：去掉上下相邻一侧的圆角 */
  vertical: unknown;
}

/** 组交给里面的控件的状态 */
export interface AttachedState {
  /** 排列方向：决定去掉哪一侧的圆角 */
  readonly orientation: keyof AttachedOrientations;
}

/** 相连的一组的上下文：按钮家族与输入框外壳据此相连 */
export const AttachedContext = createContext<AttachedState>('Attached');

/**
 * 组里相连的控件：去掉相邻一侧的圆角，边框叠在一起（不显得加粗）；
 * 悬停、聚焦的那个浮到上面，边框与焦点环不被邻居盖住。
 * 只在“不是第一个 / 最后一个”时设值：两端不写，控件自己的圆角（radiusStyles）照常生效
 * （写成 default: 0 再在首尾设 null 时，null 只是不生成规则，0 仍然生效）
 */
export const attachedStyles = css.create({
  horizontal: {
    position: 'relative',
    zIndex: { default: null, ':hover': 1, ':focus-visible': 2, ':focus-within': 2 },
    marginInlineStart: {
      default: null,
      ':not(:nth-child(1 of :not([popover], [hidden], input[type="hidden"], template)))': `calc(-1 * ${t.borderWidths.xs})`,
    },
    borderStartStartRadius: {
      default: null,
      ':not(:nth-child(1 of :not([popover], [hidden], input[type="hidden"], template)))': 0,
    },
    borderEndStartRadius: {
      default: null,
      ':not(:nth-child(1 of :not([popover], [hidden], input[type="hidden"], template)))': 0,
    },
    borderStartEndRadius: {
      default: null,
      ':not(:nth-last-child(1 of :not([popover], [hidden], input[type="hidden"], template)))': 0,
    },
    borderEndEndRadius: {
      default: null,
      ':not(:nth-last-child(1 of :not([popover], [hidden], input[type="hidden"], template)))': 0,
    },
  },
  vertical: {
    position: 'relative',
    zIndex: { default: null, ':hover': 1, ':focus-visible': 2, ':focus-within': 2 },
    marginBlockStart: {
      default: null,
      ':not(:nth-child(1 of :not([popover], [hidden], input[type="hidden"], template)))': `calc(-1 * ${t.borderWidths.xs})`,
    },
    borderStartStartRadius: {
      default: null,
      ':not(:nth-child(1 of :not([popover], [hidden], input[type="hidden"], template)))': 0,
    },
    borderStartEndRadius: {
      default: null,
      ':not(:nth-child(1 of :not([popover], [hidden], input[type="hidden"], template)))': 0,
    },
    borderEndStartRadius: {
      default: null,
      ':not(:nth-last-child(1 of :not([popover], [hidden], input[type="hidden"], template)))': 0,
    },
    borderEndEndRadius: {
      default: null,
      ':not(:nth-last-child(1 of :not([popover], [hidden], input[type="hidden"], template)))': 0,
    },
  },
});
