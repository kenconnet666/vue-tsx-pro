/**
 * 示例的“画布”：淡淡的点阵与页面区分开；字号、行高改回界面默认值，示例显示的就是组件的默认大小。
 * 示例卡片（Example）与组件演练场的预览区共用。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';

export const canvasStyles = stylex.create({
  canvas: {
    fontSize: '_md',
    lineHeight: '_normal',
    backgroundColor: '_surface',
    backgroundImage: 'radial-gradient(_colors.border 1px, transparent 1px)',
    backgroundSize: '18px 18px',
    backgroundPosition: '-9px -9px',
  },
});
