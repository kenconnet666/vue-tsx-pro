/**
 * 步骤条（ol）：多步流程里的位置（下单、注册、配置向导、任务的流转）。当前步骤带 aria-current="step"，
 * 已完成的步骤显示对勾（Lucide 的 Check），出错的步骤显示警示图标；已完成、未开始、出错另有读屏文字，不只靠颜色。
 *
 *   <Steps current={1} items={[{ title: '填写信息' }, { title: '确认订单' }, { title: '完成' }]} />
 *   <Steps _current={step} items={items} navigable />               已完成的步骤可以点回去
 *   <Steps current={2} items={[{ title: '概览', href: '/task/1' }, …]} />   已完成的步骤是链接
 *
 * 每一步的状态默认按 current 推出（之前已完成、当前、之后未开始），item 的 status 可以改：出错的一步、非线性的流程。
 */
import { Check } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { Icon, type IconData } from '../base/Icon';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { useRouterLink } from '../utils/dom/link';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { statusIcons } from '../utils/style/tone-styles';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { FlexOrderedList, type FlexProps } from '../layout/Flex';
import { t } from '../config/theme/tokens';

/** 步骤条方向 */
export interface StepsOrientations {
  /** 横排（默认） */
  horizontal: unknown;
  /** 竖排：步骤多、说明长时；步骤之间有竖的连接线 */
  vertical: unknown;
}

/** 步骤的状态 */
export interface StepStates {
  /** 已完成：对勾、品牌色 */
  complete: unknown;
  /** 当前：aria-current="step" */
  current: unknown;
  /** 未开始 */
  upcoming: unknown;
  /** 出错：警示图标、危险色 */
  error: unknown;
}

/** 步骤的状态：已完成、当前、未开始、出错 */
export type StepState = keyof StepStates;

/** 一个步骤 */
export interface StepItem {
  /** 唯一的 key；不写时用位置 */
  key?: string;
  /** 标题 */
  title: VNodeChild;
  /** 说明（标题下面的小字） */
  description?: VNodeChild;
  /** 代替序号的图标；已完成时仍显示对勾，出错时仍显示警示图标 */
  icon?: IconData;
  /** 状态；不写时按 current 推出 */
  status?: StepState;
  /** 地址：已完成的这一步渲染成链接（走路由适配），点了跳过去 */
  href?: string;
  /** 不可点回（即使已完成、有 href 或 navigable） */
  disabled?: boolean;
}

/** 未声明的属性落到 ol 上；aria-label 是步骤条的名称 */
export interface StepsProps extends PartProps<'ol'> {
  /** 步骤 */
  items: readonly StepItem[];
  /** 当前步骤的序号，从 0 开始：父级可以写 _current={x}，配合 navigable 点回已完成的步骤 */
  _current?: number;
  /** 方向，默认 horizontal */
  orientation?: keyof StepsOrientations;
  /** 字号档位：圆圈、文字随之缩放；不写时继承上下文字号 */
  size?: TextSize;
  /** 已完成的步骤可以点击回去：点了写回 current */
  navigable?: boolean;
  /** 每个步骤（li）的部件属性，可以按项计算 */
  propsItem?: PartProps<'li'> | ((item: StepItem, index: number) => PartProps<'li'>);
  /** 序号圆圈的部件属性 */
  propsIndicator?: PartProps<'span'>;
  /** 可点回的步骤外层（按钮，或有 href 时的链接）的部件属性 */
  propsTrigger?: Partial<ButtonBaseProps> & PartProps<'a'>;
  /** 文字区（标题与说明的容器）的部件属性 */
  propsText?: PartProps<'span'>;
  /** 标题的部件属性 */
  propsTitle?: PartProps<'span'>;
  /** 说明的部件属性 */
  propsDescription?: PartProps<'span'>;
  /** 步骤之间连接线的部件属性 */
  propsConnector?: PartProps<'span'>;
}

/** Steps 的样式：item、itemVertical、trigger、link、indicator、text、title、description、connector 等 */
export const stepsStyles = css.create({
  item: {
    display: 'flex',
    flexGrow: 1,
    flexBasis: 0,
    alignItems: 'flex-start',
    gap: '_sm',
    minWidth: 0,
  },
  // 竖排：高度随内容，连接线相对这一项定位
  itemVertical: { flexGrow: 0, flexBasis: 'auto', position: 'relative' },
  // 可点回的步骤：整块是按钮或链接
  // 去掉按钮默认外观、焦点环、波纹由 ButtonBase 给出
  trigger: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '_sm',
    borderRadius: '_sm',
    textAlign: 'start',
  },
  link: { color: 'inherit', textDecorationLine: 'none' },
  indicator: {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '2em',
    height: '2em',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderRadius: '_full',
    // 用 em 而不是 _sm（默认字号下 13 / 14 ≈ 0.93）：随 size 缩放
    fontSize: '0.93em',
    fontWeight: '_semibold',
    // 走到下一步时圆圈换色、连接线变色都过渡，不是一下跳过去
    transition: `background-color ${t.durations.md} ${t.easings.standard}, border-color ${t.durations.md} ${t.easings.standard}, color ${t.durations.md} ${t.easings.standard}`,
  },
  text: { display: 'grid', gap: '_xs', paddingTop: '0.3em', minWidth: 0 },
  title: { fontWeight: '_medium' },
  description: { color: '_textMuted', fontSize: '0.93em' },
  // 步骤之间的连接线：横排在标题右侧延伸
  connector: {
    flexGrow: 1,
    alignSelf: 'center',
    minWidth: '_space.lg',
    height: '_borderWidths.xs',
    backgroundColor: '_border',
    transition: `background-color ${t.durations.md} ${t.easings.standard}`,
  },
  // 竖排：从圆圈下面一直连到下一步的圆圈（圆圈宽 2 × 0.93em，中线在 0.93em）
  connectorVertical: {
    position: 'absolute',
    insetInlineStart: '0.93em',
    insetBlockStart: `calc(1.86em + ${t.space.xs})`,
    insetBlockEnd: `calc(-1 * ${t.space.lg} + ${t.space.xs})`,
    width: '_borderWidths.xs',
    height: 'auto',
    minWidth: 0,
    // 两端都定了位置时按 align-self 对齐：横排的 center 会让空的 span 缩成 0 高，这里要拉伸
    alignSelf: 'stretch',
    marginInlineStart: `calc(${t.borderWidths.xs} / -2)`,
  },
  connectorDone: { backgroundColor: '_accent' },
});

/** Steps 的样式：complete、current、upcoming、error */
export const stepsStateStyles = css.create({
  complete: { borderColor: '_accent', backgroundColor: '_accent', color: '_accentContrast' },
  current: { borderColor: '_accent', color: '_accentText' },
  upcoming: { borderColor: '_border', color: '_textMuted' },
  error: { borderColor: '_danger', backgroundColor: '_dangerSoft', color: '_dangerText' },
});

/** 步骤条：已完成、当前、未开始、出错；已完成的步骤可以点回去或是链接 */
export const Steps = _component(
  ({
    items,
    _current: current = _bindable(0),
    orientation = 'horizontal',
    size,
    navigable = false,
    propsItem,
    propsIndicator,
    propsTrigger,
    propsText,
    propsTitle,
    propsDescription,
    propsConnector,
    ...rest
  }: StepsProps) => {
    const lang = useLang();
    const router = useRouterLink();
    return () => {
      const vertical = orientation === 'vertical';
      return (
        <FlexOrderedList
          {...mergePartProps<FlexProps<'ol'>>(
            {
              direction: vertical ? 'column' : 'row',
              gap: vertical ? 'lg' : 'sm',
              sx: size && fontSizeStyles[size],
            },
            rest,
          )}
          data-orientation={orientation}
        >
          {items.map((item, index) => {
            const state: StepState =
              item.status ??
              (index < current ? 'complete' : index === current ? 'current' : 'upcoming');
            const own = typeof propsItem === 'function' ? propsItem(item, index) : propsItem;
            const content = [
              <span
                {...mergeAttrs<'span'>({ sx: stepsStyles.indicator }, propsIndicator, {
                  sx: stepsStateStyles[state],
                  'aria-hidden': true,
                })}
              >
                {state === 'complete' ? (
                  <Icon icon={Check} />
                ) : state === 'error' ? (
                  <Icon icon={statusIcons.danger} />
                ) : item.icon ? (
                  <Icon icon={item.icon} />
                ) : (
                  index + 1
                )}
              </span>,
              <span {...mergeAttrs<'span'>({ sx: stepsStyles.text }, propsText)}>
                <span {...mergeAttrs<'span'>({ sx: stepsStyles.title }, propsTitle)}>
                  {item.title}
                  {/* 当前步骤由 aria-current 念出，其余的状态补一句文字：不只靠颜色与图标 */}
                  {state !== 'current' && <VisuallyHidden>{lang.stepState(state)}</VisuallyHidden>}
                </span>
                {item.description != null && (
                  <span {...mergeAttrs<'span'>({ sx: stepsStyles.description }, propsDescription)}>
                    {item.description}
                  </span>
                )}
              </span>,
            ];
            const reachable = state === 'complete' && !item.disabled;
            const link = reachable && item.href != null;
            const button = reachable && !link && navigable;
            return (
              <li
                key={item.key ?? index}
                {...mergeAttrs<'li'>(
                  { sx: [stepsStyles.item, vertical && stepsStyles.itemVertical] },
                  own,
                  { 'aria-current': state === 'current' ? 'step' : undefined },
                )}
                data-state={state}
              >
                {link ? (
                  <a
                    {...mergeAttrs<'a'>(
                      { sx: [stepsStyles.trigger, stepsStyles.link, focusRingStyles.visible] },
                      propsTrigger,
                      {
                        href: router.href(item.href!),
                        onClick: (event: MouseEvent) => router.onClick(event, item.href!),
                      },
                    )}
                  >
                    {content}
                  </a>
                ) : button ? (
                  <ButtonBase
                    {...mergePartProps<ButtonBaseProps>({ sx: stepsStyles.trigger }, propsTrigger, {
                      onClick: () => (current = index),
                    })}
                  >
                    {content}
                  </ButtonBase>
                ) : (
                  content
                )}
                {index < items.length - 1 && (
                  <span
                    {...mergeAttrs<'span'>(
                      { sx: [stepsStyles.connector, vertical && stepsStyles.connectorVertical] },
                      propsConnector,
                      {
                        sx: state === 'complete' && stepsStyles.connectorDone,
                        'aria-hidden': true,
                      },
                    )}
                  />
                )}
              </li>
            );
          })}
        </FlexOrderedList>
      );
    };
  },
);
