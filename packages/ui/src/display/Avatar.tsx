/**
 * 头像（span，role="img"）：显示图片，图片还没加载好或加载失败时显示后备内容（默认是名字的首字母）。
 * 名称写在外层（aria-label），图片本身是装饰（alt=""），读屏不会念两遍；没有 name 时整个头像是装饰性的（对读屏隐藏）。
 *
 *   <Avatar src={user.avatar} name={user.name} />
 *   <Avatar name="张三" size="lg" radius="md" />
 *   <Avatar name="李四" variant="solid" tone="success" />
 */
import { User } from '@lucide/icons';
import { useComponent } from '../config/components';
import { createContext, _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { watch, type VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { imageLoaded } from '../utils/dom/element';
import { mergeAttrs, type PartProps } from '../utils/props';
import { statusToneStyles, type StatusTone } from '../utils/style/tone-styles';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { radiusStyles, variantOf, type Radius } from '../utils/style/styles';
import { t } from '../config/theme/tokens';

/** 后备内容（首字母、图标）的底色样式 */
export interface AvatarVariants {
  /** 浅色底（默认） */
  soft: unknown;
  /** 实底 */
  solid: unknown;
}

/** 头像的外观选项；可以用 createUi / Provider 的 defaults.Avatar 统一改默认值 */
export interface AvatarOptions {
  /** 字号档位，头像边长是它的 2.5 倍；不写时继承 */
  size?: TextSize;
  /** 圆角，默认 full（圆形）；团队、组织、应用的图标常用 md（圆角方形） */
  radius?: Radius;
  /** 后备内容的底色样式，默认 soft */
  variant?: keyof AvatarVariants;
  /** 后备内容的色调（与 Button、Badge 等同一套），默认 accent */
  tone?: StatusTone;
  /** 只是装饰：名字已经写在旁边（用户按钮、成员列表的一行）时对读屏隐藏，name 仍用来生成首字母 */
  decorative?: boolean;
}

/** 角色与读屏可见性由组件按 name 决定 */
export type AvatarManaged = 'role' | 'aria-hidden';

/** 未声明的属性落到外层 span 上 */
export interface AvatarProps extends PartProps<'span', AvatarManaged>, AvatarOptions {
  /** 图片地址；不写或加载失败时显示后备内容 */
  src?: string;
  /** 名字：无障碍名称，也用来生成首字母；不写时头像是装饰性的 */
  name?: string;
  /** 后备内容，默认是名字的首字母，没有名字时是人像图标 */
  fallback?: VNodeChild;
  /** 图片的部件属性 */
  propsImage?: PartProps<'img', 'src' | 'alt'>;
  /** 后备内容的部件属性 */
  propsFallback?: PartProps<'span'>;
}

/** 在 AvatarGroup 里：Avatar 据此叠放（AvatarGroup 提供） */
export const AvatarGroupContext = createContext<{ readonly grouped: true }>('AvatarGroup');

/**
 * 头像的配方：部件 root（外层）、image（图片）、fallback（后备内容）；在头像组里、图片加载中是档位。
 * 后备内容的底色来自共用的 statusToneStyles，排在配方之前，createUi / Provider 的 styles.Avatar 能盖过它
 */
export const avatarRecipe = css.recipe({
  name: 'Avatar',
  parts: ['root', 'image', 'fallback'],
  base: {
    root: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      width: '2.5em',
      height: '2.5em',
      overflow: 'hidden',
      verticalAlign: 'middle',
      userSelect: 'none',
    },
    image: { width: '_full', height: '_full', objectFit: 'cover' },
    fallback: { fontWeight: '_medium', lineHeight: 1, textTransform: 'uppercase' },
  },
  variants: {
    // 头像组里：往前叠 0.5em，一圈页面底色的描边把相邻的分开（AvatarGroup 的“+N”也用它）
    grouped: {
      true: {
        root: {
          boxShadow: `0 0 0 ${t.borderWidths.sm} ${t.colors.background}`,
          marginInlineStart: { default: '-0.5em', ':first-child': 0 },
        },
      },
    },
    // 图片加载完之前先藏起来（仍在 DOM 里加载），后备内容垫在下面
    loading: { true: { image: { position: 'absolute', opacity: 0 } } },
    radius: variantOf(radiusStyles, 'root'),
    size: variantOf(fontSizeStyles, 'root'),
  },
});

/** 头像的部件（createUi / Provider 的 styles.Avatar 按它定制） */
export type AvatarPart = (typeof avatarRecipe.parts)[number];

/** 名字的首字母：中文取最后一个字（通常是名），其他语言取前两个词的首字母 */
export function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  // 按码点取：表情、扩展区的汉字是两个码元，取半个会显示成乱码
  if (/[㐀-鿿]/.test(trimmed)) return Array.from(trimmed).at(-1)!;
  const words = trimmed.split(/\s+/);
  const first = (word: string) => String.fromCodePoint(word.codePointAt(0)!);
  return (first(words[0]!) + (words.length > 1 ? first(words.at(-1)!) : '')).toUpperCase();
}

/** 头像：图片 + 后备内容（首字母或图标） */
export const Avatar = _component(
  ({
    src,
    name,
    fallback,
    size,
    radius,
    variant,
    tone,
    decorative = false,
    propsImage,
    propsFallback,
    ...rest
  }: AvatarProps) => {
    const ui = useComponent(avatarRecipe, () => ({ size, radius, variant, tone }), {
      radius: 'full',
      variant: 'soft',
      tone: 'accent',
    });
    const group = AvatarGroupContext.inject(null);
    // 图片状态：loading 加载中、loaded 已显示、error 失败（显示后备内容）
    let status = _state<'loading' | 'loaded' | 'error'>('loading');
    watch(
      () => src,
      () => (status = 'loading'),
    );

    return () => {
      const showFallback = !src || status !== 'loaded';
      const {
        options: { variant: fill, tone: color },
        parts: s,
      } = ui({ grouped: !!group, loading: status === 'loading' });
      return (
        <span
          {...mergeAttrs<'span'>(
            {
              ...s.root,
              sx: [statusToneStyles[fill][color], s.root.sx],
            },
            rest,
            name && !decorative ? { role: 'img', 'aria-label': name } : { 'aria-hidden': true },
          )}
          data-state={src ? status : 'fallback'}
        >
          {src && status !== 'error' && (
            <img
              key={src}
              alt=""
              {...mergeAttrs<'img'>(s.image, propsImage, {
                src,
                ref: (element: unknown) => {
                  if (status === 'loading' && imageLoaded(element)) status = 'loaded';
                },
                onLoad: () => (status = 'loaded'),
                onError: () => (status = 'error'),
              })}
            />
          )}
          {showFallback && (
            <span {...mergeAttrs<'span'>(s.fallback, propsFallback, { 'aria-hidden': true })}>
              {fallback ?? (name ? initials(name) : <Icon icon={User} />)}
            </span>
          )}
        </span>
      );
    };
  },
);
