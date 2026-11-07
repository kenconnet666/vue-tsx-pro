/**
 * “纸面”的颜色：要被拍照、扫描、打印、导出成图片的东西（二维码、手写签名）一律浅底深色。
 * 浅色主题下跟着主题的 surface 与文字色；深色主题下仍是白底近黑，不跟着反色（反色的二维码很多扫码器认不出，
 * 导出的签名放到白纸上也看不见）。靠 CSS 的 light-dark()，取决于所在元素的 color-scheme（主题写在容器上）。
 */
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { t } from '../../config/theme/tokens';

/** 纸面的底色 */
export const paperBackground = `light-dark(${t.colors.surface}, #ffffff)`;
/** 纸面上的墨色 */
export const paperInk = `light-dark(${t.colors.text}, #1c2024)`;

/** 纸面的样式：paper（底色与墨色） */
export const paperStyles = css.create({
  paper: { color: paperInk, backgroundColor: paperBackground },
});
