/**
 * 浮动按钮：页面角落的常驻操作（新建、反馈、客服、回到顶部）。参考 Ant Design 的 FloatButton、MUI 的 SpeedDial。
 *
 *   <FloatButton icon={MessageCircle} aria-label="联系客服" />            单个：固定在视口结束边的底角
 *   <FloatButtonGroup>                                                     一组：竖排固定在角落，BackTop 也能放进来
 *     <FloatButton icon={MessageCircle} aria-label="联系客服" badge={2} />
 *     <BackTop />
 *   </FloatButtonGroup>
 *   <FloatButtonGroup icon={Plus} aria-label="快捷操作">…</FloatButtonGroup>   速拨：主按钮展开、收起其余按钮
 *
 * 按钮是 IconButton（圆形、大一号、带阴影），悬停或聚焦时提示名称（tooltip，默认就是 aria-label），badge 是角标（Indicator）。
 * 位置在视口的结束边与底部（insetInlineEnd，从右到左排版时在左下），留出刘海屏的安全区；要避开底部的操作栏时用 sx 改 insetBlockEnd。
 * 速拨：主按钮带 aria-expanded、aria-controls，展开后其余按钮从主按钮上方依次出现；Esc 或点按钮以外的地方收起，焦点回到主按钮。
 * 部件：Root（div，组）、Actions（速拨展开的那一列）、Trigger（速拨的主按钮）。
 */
import { X } from '@lucide/icons';
import { createContext, _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { useId, type VNodeChild } from 'vue';
import type { IconData } from '../base/Icon';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { Indicator } from '../base/Indicator';
import { t } from '../config/theme/tokens';
import { Tooltip } from '../overlay/Tooltip';
import { useEventListener } from '../utils/dom/event-listener';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { partAttrs } from '../config/styles';

/** 在 FloatButtonGroup 里：按钮跟着组排，不再自己固定在角落 */
export const FloatButtonGroupContext = createContext<boolean>('FloatButtonGroup');

/** 固定在视口角落：结束边与底部，留出安全区 */
const corner = {
  position: 'fixed',
  insetInlineEnd: `calc(${t.space.lg} + env(safe-area-inset-right, 0px))`,
  insetBlockEnd: `calc(${t.space.lg} + env(safe-area-inset-bottom, 0px))`,
  zIndex: 20,
} as const;

/** 部件的标记（data-scope="float-button-group"） */
const floatButtonGroupPart = (part: string) => partAttrs({ name: 'FloatButtonGroup' }, part);

/** FloatButton、FloatButtonGroup 的样式：corner、button、group、actions、hidden */
export const floatButtonStyles = css.create({
  corner,
  button: { boxShadow: '_md' },
  group: { ...corner, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '_sm' },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '_sm',
    transition: `opacity ${t.durations.md} ${t.easings.standard}, translate ${t.durations.md} ${t.easings.standard}`,
  },
  hidden: { opacity: 0, translate: '0 0.75em', pointerEvents: 'none', visibility: 'hidden' },
});

/** 未声明的属性落到按钮（IconButton）上 */
export interface FloatButtonProps extends Partial<Omit<IconButtonProps, 'icon'>> {
  /** 图标 */
  icon: IconData;
  /** 名称（读屏，也是默认的提示） */
  'aria-label': string;
  /** 悬停、聚焦时的提示，默认是 aria-label；false 不提示 */
  tooltip?: VNodeChild | false;
  /** 角标：数字（未读数）或 true（一个小圆点） */
  badge?: number | boolean;
}

/** 浮动按钮：单独用时固定在视口角落，在 FloatButtonGroup 里跟着组排 */
export const FloatButton = _component(({ icon, tooltip, badge, ...rest }: FloatButtonProps) => {
  const grouped = FloatButtonGroupContext.inject(false);
  return () => {
    // badge={count > 0} 没有未读时是 false：和没写一样，不套角标
    const badged = badge != null && badge !== false;
    const button = (props: object = {}) => (
      <IconButton
        {...mergePartProps<IconButtonProps>(
          {
            icon,
            'aria-label': rest['aria-label'],
            variant: 'surface',
            tone: 'neutral',
            radius: 'full',
            size: 'lg',
            sx: [floatButtonStyles.button, !grouped && !badged && floatButtonStyles.corner],
          },
          rest,
          props,
        )}
      />
    );
    const withBadge = (node: VNodeChild) =>
      !badged ? (
        node
      ) : (
        <Indicator
          count={typeof badge === 'number' ? badge : undefined}
          dot={badge === true}
          overlap="circular"
          sx={!grouped && floatButtonStyles.corner}
        >
          {node}
        </Indicator>
      );
    const tip = tooltip === undefined ? rest['aria-label'] : tooltip;
    if (tip === false) return withBadge(button());
    return withBadge(
      <Tooltip placement="left" trigger={(props) => button(props)}>
        {tip}
      </Tooltip>,
    );
  };
});

/** 未声明的属性落到外层 div 上 */
export interface FloatButtonGroupProps extends PartProps<'div'> {
  /** 给了就是速拨：主按钮用这个图标，点一下展开、收起其余按钮 */
  icon?: IconData;
  /** 速拨的主按钮的名称（读屏） */
  'aria-label'?: string;
  /** 速拨是否展开：父级写 _open={x} */
  _open?: boolean;
  /** 速拨展开的那一列的部件属性 */
  propsActions?: PartProps<'div'>;
  /** 速拨主按钮的部件属性 */
  propsTrigger?: Partial<FloatButtonProps>;
  /** FloatButton、BackTop */
  children?: VNodeChild;
}

/** 一组浮动按钮：竖排固定在视口角落；给了 icon 时是速拨 */
export const FloatButtonGroup = _component(
  ({
    icon,
    _open: open = _bindable(false),
    propsActions,
    propsTrigger,
    children,
    'aria-label': label,
    ...rest
  }: FloatButtonGroupProps) => {
    FloatButtonGroupContext.provide(true);
    const actionsId = useId();
    let root = _state.raw<HTMLElement | null>(null);
    let trigger = _state.raw<HTMLElement | null>(null);

    const close = (refocus: boolean) => {
      open = false;
      if (refocus) trigger?.querySelector('button')?.focus();
    };
    useEventListener(
      () => (icon && open ? document : null),
      'pointerdown',
      (event: PointerEvent) => {
        if (!root?.contains(event.target as Node)) close(false);
      },
    );

    return () => (
      <div
        {...mergeAttrs<'div'>(
          { sx: floatButtonStyles.group, ...floatButtonGroupPart('root') },
          rest,
          {
            ref: _toRef(root),
            role: 'group',
            'aria-label': icon ? undefined : label,
            onKeydown: (event: KeyboardEvent) => {
              if (icon && open && event.key === 'Escape') close(true);
            },
          },
        )}
      >
        {icon ? (
          <>
            <div
              {...mergeAttrs<'div'>(
                {
                  sx: [floatButtonStyles.actions, !open && floatButtonStyles.hidden],
                  ...floatButtonGroupPart('actions'),
                },
                propsActions,
                { id: actionsId },
              )}
            >
              {children}
            </div>
            <span ref={_toRef(trigger)}>
              <FloatButton
                {...mergePartProps<FloatButtonProps>(
                  {
                    icon: open ? X : icon,
                    variant: 'solid',
                    tone: 'accent',
                    'aria-label': label ?? '',
                    tooltip: false,
                  },
                  propsTrigger,
                  {
                    'aria-expanded': open,
                    'aria-controls': actionsId,
                    onClick: () => (open = !open),
                  },
                )}
              />
            </span>
          </>
        ) : (
          children
        )}
      </div>
    );
  },
);
