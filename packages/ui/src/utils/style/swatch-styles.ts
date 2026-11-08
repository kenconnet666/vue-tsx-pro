/**
 * 色块共用的样式：ColorSwatch、ColorField、ThemeCustomizer 里画一块颜色。
 * 棋盘格垫在下面，半透明的颜色看得出来；内描边按正文色的淡色画出色块边界，亮色、暗色主题里都看得见。
 */
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { t } from '../../config/theme/tokens';

/** 色块的样式：checkerboard、ring、interactive */
export const swatchStyles = css.create({
  // 格子大小用 em：随色块所在的字号缩放
  checkerboard: {
    backgroundImage: `repeating-conic-gradient(${t.colors.fill} 0 25%, ${t.colors.surface} 0 50%)`,
    backgroundSize: '0.5em 0.5em',
  },
  ring: {
    boxShadow: `inset 0 0 0 ${t.borderWidths.xs} color-mix(in oklab, ${t.colors.text} 14%, transparent)`,
  },
  // 能点的色块（预设色、打开取色器的按钮）：悬停时略微放大。描边画在里层，按钮的悬停改不到它，所以放大整块
  interactive: {
    scale: { default: 1, _hover: 1.1 },
    transition: `scale ${t.durations.sm} ${t.easings.standard}`,
  },
});
