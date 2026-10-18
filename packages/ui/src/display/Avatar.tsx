/**
 * 头像（span，role="img"）：显示图片，图片还没加载好或加载失败时显示后备内容（默认是名字的首字母）。
 * 名称写在外层（aria-label），图片本身是装饰（alt=""），读屏不会念两遍；没有 name 时整个头像是装饰性的（对读屏隐藏）。
 *
 *   <Avatar src={user.avatar} name={user.name} />
 *   <Avatar name="张三" size="lg" radius="md" />
 */
import { User } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { watch, type VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { useDefaults } from '../config/defaults';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { fontSizeStyles, type TextSize } from '../utils/typography';

/** 头像的圆角 */
export interface AvatarRadii {
  /** 圆形（默认） */
  full: unknown;
  /** 圆角方形：团队、组织、应用的图标 */
  md: unknown;
}

/** 头像的外观选项；可以用 createUi / Provider 的 defaults.Avatar 统一改默认值 */
export interface AvatarOptions {
  /** 字号档位，头像边长是它的 2.5 倍；不写时继承 */
  size?: TextSize;
  /** 圆角，默认 full */
  radius?: keyof AvatarRadii;
}

/** 角色与读屏可见性由组件按 name 决定 */
type Managed = 'role' | 'aria-hidden';

/** 未声明的属性落到外层 span 上 */
export interface AvatarProps extends PartProps<'span', Managed>, AvatarOptions {
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

const styles = stylex.create({
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
    backgroundColor: '_accentSoft',
    color: '_accentText',
    userSelect: 'none',
  },
  full: { borderRadius: '_full' },
  md: { borderRadius: '_md' },
  image: { width: '_full', height: '_full', objectFit: 'cover' },
  // 图片加载完之前先藏起来（仍在 DOM 里加载），后备内容垫在下面
  loading: { position: 'absolute', opacity: 0 },
  fallback: { fontWeight: '_medium', lineHeight: 1, textTransform: 'uppercase' },
});

/** 名字的首字母：中文取最后一个字（通常是名），其他语言取前两个词的首字母 */
export function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  if (/[㐀-鿿]/.test(trimmed)) return trimmed.at(-1)!;
  const words = trimmed.split(/\s+/);
  return (words[0]![0]! + (words.length > 1 ? words.at(-1)![0]! : '')).toUpperCase();
}

/** 头像：图片 + 后备内容（首字母或图标） */
export const Avatar = _component(
  ({ src, name, fallback, size, radius, propsImage, propsFallback, ...rest }: AvatarProps) => {
    const defaults = useDefaults('Avatar');
    // 图片状态：loading 加载中、loaded 已显示、error 失败（显示后备内容）
    let status = _state<'loading' | 'loaded' | 'error'>('loading');
    watch(
      () => src,
      () => (status = 'loading'),
    );

    return () => {
      const showFallback = !src || status !== 'loaded';
      return (
        <span
          {...elementProps(
            mergeProps<'span'>(
              {
                sx: [
                  styles.root,
                  styles[radius ?? defaults.radius ?? 'full'],
                  (size ?? defaults.size) && fontSizeStyles[(size ?? defaults.size)!],
                ],
              },
              rest,
              name ? { role: 'img', 'aria-label': name } : { 'aria-hidden': true },
            ),
          )}
          data-state={src ? status : 'fallback'}
        >
          {src && status !== 'error' && (
            <img
              key={src}
              {...elementProps(
                mergeProps<'img'>(
                  { sx: [styles.image, status === 'loading' && styles.loading] },
                  propsImage,
                  {
                    src,
                    alt: '',
                    onLoad: () => (status = 'loaded'),
                    onError: () => (status = 'error'),
                  },
                ),
              )}
            />
          )}
          {showFallback && (
            <span
              {...elementProps(
                mergeProps<'span'>({ sx: styles.fallback }, propsFallback, { 'aria-hidden': true }),
              )}
            >
              {fallback ?? (name ? initials(name) : <Icon icon={User} />)}
            </span>
          )}
        </span>
      );
    };
  },
);
