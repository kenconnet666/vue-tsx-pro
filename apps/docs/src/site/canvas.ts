/**
 * 示例的“画布”：页面底色衬底（同真实页面：卡片、浮层的表面色在它上面才分得出层级），
 * 字号、行高改回界面默认值，示例显示的就是组件的默认大小。示例卡片（Example）与组件演练场的预览区共用。
 */
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';

export const canvasStyles = css.create({
  canvas: { fontSize: '_md', lineHeight: '_normal', backgroundColor: '_background' },
});
