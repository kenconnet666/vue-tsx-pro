/**
 * 用户按钮：头像 + 名字（可带一行说明）+ 展开箭头，做账号菜单、切换账号的触发器；放在 AppShell 顶栏、侧栏底部。
 * 参考 Mantine 的 UserButton、Ant Design Pro 的 AvatarDropdown。
 *
 *   <Menu trigger={(props) => <UserButton {...props} name="林小满" />}>…</Menu>
 *   <UserButton name="林小满" description="采购部 · 管理员" src={avatarUrl} />   两行：名字与说明
 *   <UserButton name="林小满" compact />                                       只剩头像（名字是按钮的名称）
 *
 * 没有说明时是一颗圆角的胶囊（顶栏）；有说明时是占满宽度的一行（侧栏底部），箭头换成上下双箭头。
 */
import { ChevronDown, ChevronsUpDown } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { useComponent } from '../config/components';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { relativeFontSizes } from '../utils/style/typography';
import { Avatar, type AvatarProps } from './Avatar';

/** UserButton 的档位（createUi / Provider 的 components.UserButton.defaults） */
export interface UserButtonOptions {
  /** 只显示头像（顶栏空间紧、侧栏收起时） */
  compact?: boolean;
}

/** 未声明的属性落到按钮（ButtonBase）上 */
export interface UserButtonProps extends Omit<ButtonBaseProps, 'children'>, UserButtonOptions {
  /** 名字：显示在头像旁边；只剩头像时是按钮的名称 */
  name: string;
  /** 名字下面的一行说明：部门、角色、邮箱 */
  description?: VNodeChild;
  /** 头像图片；没有时显示名字的首字母 */
  src?: string;
  /** 结束边的箭头；false 不要。默认 ChevronDown，有说明时 ChevronsUpDown */
  indicator?: IconData | false;
  /** 头像的部件属性 */
  propsAvatar?: Partial<AvatarProps>;
  /** 名字的部件属性 */
  propsName?: PartProps<'span'>;
  /** 说明的部件属性 */
  propsDescription?: PartProps<'span'>;
  /** 箭头的部件属性 */
  propsIndicator?: Partial<IconProps>;
}

/**
 * UserButton 的配方（createUi / Provider 的 components.UserButton 按它定制）：root（ButtonBase）、avatar、text（名字与说明的外层）、
 * name、description、indicator（箭头）。compact 是档位；有说明（described）且不是 compact 时整行显示
 */
export const userButtonRecipe = css.recipe({
  name: 'UserButton',
  parts: ['root', 'avatar', 'text', 'name', 'description', 'indicator'],
  base: {
    root: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '_sm',
      maxWidth: '_full',
      paddingBlock: '_xs',
      paddingInlineStart: '_xs',
      paddingInlineEnd: '_sm',
      borderRadius: '_full',
      color: '_text',
      textAlign: 'start',
      backgroundColor: { default: 'transparent', _hover: '_fillHover' },
    },
    avatar: { flexShrink: 0 },
    text: { display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 },
    name: {
      fontWeight: '_medium',
      fontSize: relativeFontSizes.sm,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    description: {
      color: '_textMuted',
      fontSize: relativeFontSizes.xs,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    indicator: { flexShrink: 0, color: '_textMuted' },
  },
  variants: {
    compact: { true: { root: { padding: '_xs' } } },
    described: { true: {} },
  },
  compound: [
    // 有说明：占满宽度的一行（侧栏底部），圆角随普通的行
    {
      match: { described: true, compact: false },
      root: { display: 'flex', width: '_full', paddingInline: '_sm', borderRadius: '_md' },
    },
  ],
});

/** UserButton 的部件（createUi / Provider 的 components.UserButton.styles 按它定制） */
export type UserButtonPart = (typeof userButtonRecipe.parts)[number];

/** 用户按钮：头像 + 名字 + 箭头，账号菜单的触发器 */
export const UserButton = _component(
  ({
    name,
    description,
    src,
    compact,
    indicator,
    propsAvatar,
    propsName,
    propsDescription,
    propsIndicator,
    ...rest
  }: UserButtonProps) => {
    const ui = useComponent(userButtonRecipe, () => ({ compact }), { compact: false });
    return () => {
      const described = hasContent(description);
      const { options, parts: s } = ui({ described });
      const short = options.compact;
      const icon = indicator ?? (described && !short ? ChevronsUpDown : ChevronDown);
      return (
        <ButtonBase
          {...mergePartProps<ButtonBaseProps>(
            { ...s.root, 'aria-label': short ? name : undefined },
            rest,
          )}
        >
          <Avatar
            {...mergePartProps<AvatarProps>({ ...s.avatar, name, src, size: 'sm' }, propsAvatar)}
          />
          {!short && (
            <span {...mergeAttrs<'span'>(s.text)}>
              <span {...mergeAttrs<'span'>(s.name, propsName)}>{name}</span>
              {described && (
                <span {...mergeAttrs<'span'>(s.description, propsDescription)}>{description}</span>
              )}
            </span>
          )}
          {!short && icon && (
            <Icon {...mergePartProps<IconProps>({ ...s.indicator, icon }, propsIndicator)} />
          )}
        </ButtonBase>
      );
    };
  },
);
