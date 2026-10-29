/**
 * 色块共用的样式：ColorSwatch、ColorField、ThemeCustomizer 里画一块颜色。
 * 棋盘格垫在下面，半透明的颜色看得出来；内描边按正文色的淡色画出色块边界，亮色、暗色主题里都看得见。
 */
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { t } from '../../config/theme/tokens';

/** 色块的样式：checkerboard、ring */
export const swatchStyles = css.create({
  // 格子大小用 em：随色块所在的字号缩放
  checkerboard: {
    backgroundImage: `repeating-conic-gradient(${t.colors.fill} 0 25%, ${t.colors.surface} 0 50%)`,
    backgroundSize: '0.5em 0.5em',
  },
  ring: { boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${t.colors.text} 14%, transparent)` },
});
