/**
 * 头像组（div，role="group"）：一排头像叠放，超过 max 的折叠成“+N”。协作者、参与人、点赞的人。
 *
 *   <AvatarGroup max={3} aria-label="协作者">
 *     {members.map((member) => <Avatar key={member.id} name={member.name} src={member.avatar} />)}
 *   </AvatarGroup>
 *
 * 头像的大小随组的 size（或上下文字号）；组里的 Avatar 经 AvatarGroupContext 得知自己在组里，叠放并加一圈页面底色的描边。
 * “+N”读屏念“还有 N 人”（语言包的 avatarMore）；total 给了时按它算 N（列表只拿到了一部分时）。
 * 部件：Root（div）、More（+N）、MoreText（More 里的“+N”文字）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { childNodes } from '../utils/data/text';
import { mergeAttrs, type PartProps } from '../utils/props';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { AvatarGroupContext, avatarStyles } from './Avatar';

/** 角色由组件管理 */
export type AvatarGroupManaged = 'role';

/** 未声明的属性落到 div 上；aria-label 是这组人的名称 */
export interface AvatarGroupProps extends PartProps<'div', AvatarGroupManaged> {
  /** 最多显示几个头像，其余折叠成“+N”；不写时全部显示 */
  max?: number;
  /** 总人数：列表只拿到前几个时给出，“+N”按它算 */
  total?: number;
  /** 字号档位，头像边长是它的 2.5 倍；不写时继承 */
  size?: TextSize;
  /** “+N”的部件属性 */
  propsMore?: PartProps<'span', 'role'>;
  /** “+N”文字的部件属性；读屏念的是 More 的 aria-label，这里对读屏隐藏 */
  propsMoreText?: PartProps<'span', 'aria-hidden'>;
  /** 头像（Avatar） */
  children?: VNodeChild;
}

/** AvatarGroup 的样式：root、more、moreText */
export const avatarGroupStyles = stylex.create({
  root: { display: 'inline-flex', alignItems: 'center' },
  more: { backgroundColor: '_fill', color: '_text' },
  // 字号缩在文字上：“+N”的圆仍和头像一样大
  moreText: { fontSize: '0.875em', fontWeight: '_medium' },
});

/** 头像组：叠放的头像，超过 max 的折叠成“+N” */
export const AvatarGroup = _component(
  ({ max, total, size, propsMore, propsMoreText, children, ...rest }: AvatarGroupProps) => {
    const lang = useLang();
    AvatarGroupContext.provide({ grouped: true });
    return () => {
      const avatars = childNodes(children);
      const shown = max != null && avatars.length > max ? avatars.slice(0, max) : avatars;
      const hidden = (total ?? avatars.length) - shown.length;
      return (
        <div
          {...mergeAttrs<'div'>(
            { sx: [avatarGroupStyles.root, size && fontSizeStyles[size]] },
            rest,
            { role: 'group' },
          )}
        >
          {shown}
          {hidden > 0 && (
            <span
              {...mergeAttrs<'span'>(
                {
                  sx: [
                    avatarStyles.root,
                    avatarStyles.full,
                    avatarStyles.grouped,
                    avatarGroupStyles.more,
                  ],
                  'aria-label': lang.avatarMore(hidden),
                },
                propsMore,
                { role: 'img' },
              )}
            >
              <span
                {...mergeAttrs<'span'>({ sx: avatarGroupStyles.moreText }, propsMoreText, {
                  'aria-hidden': true,
                })}
              >
                +{hidden}
              </span>
            </span>
          )}
        </div>
      );
    };
  },
);
