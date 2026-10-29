/**
 * 空状态：列表没有数据、搜索没有结果、网络出错时，在内容区中间放一个大图标、一句说明，下面可放操作按钮。
 *
 *   <Empty />                                   暂无数据
 *   <Empty preset="search" description="没有找到相关商品" />
 *   <Empty preset="network"><Button size="sm" onClick={retry}>重新加载</Button></Empty>
 */
import { CircleAlert, Inbox, SearchX, WifiOff } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { useConfig } from '../config/context';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';

/** 预设的图标 */
export interface EmptyPresets {
  /** 没有数据（默认） */
  default: unknown;
  /** 没有搜索结果 */
  search: unknown;
  /** 网络不通 */
  network: unknown;
  /** 出错了 */
  error: unknown;
}

/** 未声明的属性落到根元素（div）上 */
export interface EmptyProps extends PartProps<'div'> {
  /**
   * 预设的图标
   * @default 'default'
   */
  preset?: keyof EmptyPresets;
  /** 自己的图标（代替预设的） */
  icon?: IconData;
  /** 说明；不给时用语言包的“暂无数据” */
  description?: VNodeChild;
  /** 下面的操作（按钮） */
  children?: VNodeChild;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 说明的部件属性 */
  propsDescription?: PartProps<'div'>;
}

/** Empty 的样式：root、icon、description、actions */
export const emptyStyles = css.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '_md',
    paddingBlock: '2.5em',
    paddingInline: '_xl',
    textAlign: 'center',
  },
  icon: { fontSize: '4em', color: '_border' },
  description: { fontSize: '_sm', lineHeight: '1.5', color: '_textMuted' },
  actions: { marginBlockStart: '_sm' },
});

const PRESETS = { default: Inbox, search: SearchX, network: WifiOff, error: CircleAlert } as const;

/** 空状态（div > 图标 + 说明 + 操作） */
export const Empty = _component(
  ({
    preset = 'default',
    icon,
    description,
    children,
    propsIcon,
    propsDescription,
    ...rest
  }: EmptyProps) => {
    const config = useConfig();
    return () => (
      <div {...mergeAttrs<'div'>({ sx: emptyStyles.root }, rest)}>
        <Icon
          {...mergePartProps<IconProps>(
            { icon: icon ?? PRESETS[preset], strokeWidth: 1.25, sx: emptyStyles.icon },
            propsIcon,
          )}
        />
        <div {...mergeAttrs<'div'>({ sx: emptyStyles.description }, propsDescription)}>
          {description ?? config.lang.empty}
        </div>
        {hasContent(children) && (
          <div {...mergeAttrs<'div'>({ sx: emptyStyles.actions })}>{children}</div>
        )}
      </div>
    );
  },
);
