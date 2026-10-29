/**
 * 色块：一块颜色加它的名称与取值。主题文档里列调色板、设计 token 用。
 *
 *   <ColorSwatch color="#3e63dd" label="品牌色" />
 *   <ColorSwatch color={colors.accent} label="accent" />   主题 token：取值按当前主题自动读出，换主题时跟着变
 *
 * 半透明的颜色（如 surfaceTranslucent）下面垫棋盘格，看得出透明度。色块是装饰，名称与取值是文字，读屏都能读到。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onMounted, watch, type VNodeChild } from 'vue';
import { useConfig } from '../config/context';
import { readToken } from '../config/theme/theme';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';
import { swatchStyles } from '../utils/style/swatch-styles';

/** 未声明的属性落到外层 div 上 */
export interface ColorSwatchProps extends PartProps<'div'> {
  /** 颜色：任意 CSS 颜色，或主题 token（colors.accent） */
  color: string;
  /** 名称 */
  label?: VNodeChild;
  /** 显示的取值；不写时：普通颜色显示它本身，token 显示当前主题下的值；false 不显示 */
  value?: VNodeChild | false;
  /** 色块的部件属性 */
  propsSwatch?: PartProps<'div'>;
}

/** ColorSwatch 的样式：root、swatch、fill、label、value */
export const colorSwatchStyles = css.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_xs', minWidth: 0 },
  // 棋盘格垫底、内描边画出边界（swatchStyles）；大色块的格子放大一倍
  swatch: {
    position: 'relative',
    height: '3rem',
    borderRadius: '_md',
    overflow: 'hidden',
    backgroundSize: '1rem 1rem',
  },
  fill: { position: 'absolute', inset: 0 },
  label: { color: '_text', fontSize: '_sm', fontWeight: '_medium' },
  value: { color: '_textMuted', fontFamily: '_mono', fontSize: '_xs' },
});

// 颜色是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** ColorSwatch 的动态样式：色块的颜色 */
export const colorSwatchDynamicStyles = css.create({
  fill: (color: string) => ({ backgroundColor: color }),
});

/** 色块（div）：颜色、名称与取值 */
export const ColorSwatch = _component(
  ({ color, label, value, propsSwatch, ...rest }: ColorSwatchProps) => {
    const config = useConfig();
    let swatch = _state.raw<HTMLElement | null>(null);
    let resolved = _state('');

    // token 在运行时是 var(--…)
    const isToken = () => color.startsWith('var(');
    // token 的值随主题变：挂载后、换主题后从色块上读
    function resolve() {
      if (swatch && isToken()) resolved = readToken(swatch, color);
    }
    onMounted(resolve);
    watch(() => [config.theme, color], resolve, { flush: 'post' });

    return () => {
      const shown = value ?? (isToken() ? resolved : color);
      return (
        <div {...mergeAttrs<'div'>({ sx: colorSwatchStyles.root }, rest)}>
          <div
            {...mergeAttrs<'div'>(
              { sx: [swatchStyles.checkerboard, colorSwatchStyles.swatch] },
              propsSwatch,
              {
                ref: _toRef(swatch),
                'aria-hidden': true,
              },
            )}
          >
            <div
              {...mergeAttrs<'div'>({
                sx: [
                  colorSwatchStyles.fill,
                  swatchStyles.ring,
                  colorSwatchDynamicStyles.fill(String(color)),
                ],
              })}
            />
          </div>
          {hasContent(label) && (
            <span {...mergeAttrs<'span'>({ sx: colorSwatchStyles.label })}>{label}</span>
          )}
          {shown !== false && shown !== '' && (
            <span {...mergeAttrs<'span'>({ sx: colorSwatchStyles.value })}>{shown}</span>
          )}
        </div>
      );
    };
  },
);
