/**
 * 主题缩略图（span）：用这套主题画一个缩小的页面：底色上一张卡片，卡片里标题、正文两行字和一个品牌色按钮。
 * 主题选择器、主题列表里代替主题名旁边的色点，一眼看出底色、表面、文字与品牌色的搭配。
 *
 *   <ThemeThumbnail theme={oceanTheme} />
 *
 * 颜色来自套在它上面的主题变量（themeAttrs），换主题不用重画；纯装饰，对读屏隐藏，名字由使用方写在旁边。
 * 尺寸用 em，随字号缩放。部件：Root（span）、Card（卡片）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { mergeAttrs, type PartProps } from '../utils/props';
import { swatchStyles } from '../utils/style/swatch-styles';
import { themeAttrs, type Theme } from '../config/theme/theme';

/** 未声明的属性落到外层 span 上 */
export interface ThemeThumbnailProps extends PartProps<'span', 'aria-hidden'> {
  /** 画哪一套主题 */
  theme: Theme;
  /** 卡片的部件属性 */
  propsCard?: PartProps<'span'>;
}

/** ThemeThumbnail 的样式：root、card、title、line、button */
export const themeThumbnailStyles = stylex.create({
  root: {
    display: 'inline-flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    flexShrink: 0,
    width: '6em',
    height: '3.75em',
    padding: '0.5em 0 0 0.75em',
    overflow: 'hidden',
    borderRadius: '_md',
    backgroundColor: '_background',
  },
  // 卡片从右下角探出来：像页面的一角
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3em',
    width: '100%',
    height: '100%',
    padding: '0.5em',
    borderStartStartRadius: '_sm',
    borderTopWidth: '_xs',
    borderInlineStartWidth: '_xs',
    borderTopStyle: 'solid',
    borderInlineStartStyle: 'solid',
    borderColor: '_border',
    backgroundColor: '_surfaceRaised',
  },
  title: { width: '70%', height: '0.35em', borderRadius: '_full', backgroundColor: '_text' },
  line: { width: '90%', height: '0.25em', borderRadius: '_full', backgroundColor: '_textMuted' },
  button: {
    width: '45%',
    height: '0.6em',
    marginBlockStart: 'auto',
    borderRadius: '_sm',
    backgroundColor: '_accent',
  },
});

/** 主题缩略图：缩小的页面一角，颜色取自这套主题 */
export const ThemeThumbnail = _component(({ theme, propsCard, ...rest }: ThemeThumbnailProps) => {
  return () => {
    const { class: themeClass, style, 'data-theme': name } = themeAttrs(theme);
    return (
      <span
        {...mergeAttrs<'span'>(
          { sx: [themeThumbnailStyles.root, swatchStyles.ring], class: themeClass, style },
          rest,
          { 'aria-hidden': true },
        )}
        data-theme={name}
      >
        <span {...mergeAttrs<'span'>({ sx: themeThumbnailStyles.card }, propsCard)}>
          <span {...stylex.attrs(themeThumbnailStyles.title)} />
          <span {...stylex.attrs(themeThumbnailStyles.line)} />
          <span {...stylex.attrs(themeThumbnailStyles.button)} />
        </span>
      </span>
    );
  };
});
