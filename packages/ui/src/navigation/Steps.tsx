/**
 * 步骤条（ol）：多步流程里的位置（下单、注册、配置向导）。当前步骤带 aria-current="step"，
 * 已完成的步骤显示对勾（Lucide 的 Check），出错的步骤显示警示图标。
 *
 *   <Steps current={1} items={[{ title: '填写信息' }, { title: '确认订单' }, { title: '完成' }]} />
 *   <Steps current={step} items={items} onStepChange={(index) => (step = index)} />   已完成的步骤可以点回去
 */
import { Check } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { Icon, type IconData } from '../base/Icon';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { statusIcons } from '../utils/style/tone-styles';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { FlexOrderedList, type FlexProps } from '../layout/Flex';

/** 步骤条方向 */
export interface StepsOrientations {
  /** 横排（默认） */
  horizontal: unknown;
  /** 竖排：步骤多、说明长时 */
  vertical: unknown;
}

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
  /** 出错：显示警示图标与危险色 */
  error?: boolean;
  /** 不可点回（即使已完成） */
  disabled?: boolean;
}

/** 步骤的状态：已完成、当前、未开始、出错 */
export type StepState = 'complete' | 'current' | 'upcoming' | 'error';

/** 未声明的属性落到 ol 上；aria-label 是步骤条的名称 */
export interface StepsProps extends PartProps<'ol'> {
  /** 步骤 */
  items: readonly StepItem[];
  /** 当前步骤的序号，从 0 开始 */
  current: number;
  /** 方向，默认 horizontal */
  orientation?: keyof StepsOrientations;
  /** 字号档位：圆圈、文字随之缩放；不写时继承上下文字号 */
  size?: TextSize;
  /** 给了就可以点击已完成的步骤回去（参数是序号） */
  onStepChange?: (index: number) => void;
  /** 每个步骤（li）的部件属性，可以按项计算 */
  propsItem?: PartProps<'li'> | ((item: StepItem, index: number) => PartProps<'li'>);
  /** 序号圆圈的部件属性 */
  propsIndicator?: PartProps<'span'>;
  /** 可点回的步骤外层按钮的部件属性 */
  propsTrigger?: Partial<ButtonBaseProps>;
  /** 文字区（标题与说明的容器）的部件属性 */
  propsText?: PartProps<'span'>;
  /** 标题的部件属性 */
  propsTitle?: PartProps<'span'>;
  /** 说明的部件属性 */
  propsDescription?: PartProps<'span'>;
  /** 步骤之间连接线的部件属性 */
  propsConnector?: PartProps<'span'>;
}

/** Steps 的样式：root、vertical、item、trigger、indicator、text 等 */
export const stepsStyles = stylex.create({
  item: {
    display: 'flex',
    flexGrow: 1,
    flexBasis: 0,
    alignItems: 'flex-start',
    gap: '_sm',
    minWidth: 0,
  },
  // 可点回的步骤：整块是按钮
  // 去掉按钮默认外观、焦点环、波纹由 ButtonBase 给出
  trigger: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '_sm',
    borderRadius: '_sm',
    textAlign: 'start',
  },
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
    transition:
      'background-color _durations.md _easings.standard, border-color _durations.md _easings.standard, color _durations.md _easings.standard',
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
    transition: 'background-color _durations.md _easings.standard',
  },
  connectorDone: { backgroundColor: '_accent' },
});

/** Steps 的样式：complete、current、upcoming、error */
export const stepsStateStyles = stylex.create({
  complete: { borderColor: '_accent', backgroundColor: '_accent', color: '_accentContrast' },
  current: { borderColor: '_accent', color: '_accentText' },
  upcoming: { borderColor: '_border', color: '_textMuted' },
  error: { borderColor: '_danger', backgroundColor: '_dangerSoft', color: '_dangerText' },
});

/** 步骤条：已完成、当前、未开始，可选点回已完成的步骤 */
export const Steps = _component(
  ({
    items,
    current,
    orientation = 'horizontal',
    size,
    onStepChange,
    propsItem,
    propsIndicator,
    propsTrigger,
    propsText,
    propsTitle,
    propsDescription,
    propsConnector,
    ...rest
  }: StepsProps) =>
    () => {
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
            const state: StepState = item.error
              ? 'error'
              : index < current
                ? 'complete'
                : index === current
                  ? 'current'
                  : 'upcoming';
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
                </span>
                {item.description != null && (
                  <span {...mergeAttrs<'span'>({ sx: stepsStyles.description }, propsDescription)}>
                    {item.description}
                  </span>
                )}
              </span>,
            ];
            const clickable = onStepChange && state === 'complete' && !item.disabled;
            return (
              <li
                key={item.key ?? index}
                {...mergeAttrs<'li'>({ sx: stepsStyles.item }, own, {
                  'aria-current': state === 'current' ? 'step' : undefined,
                })}
                data-state={state}
              >
                {clickable ? (
                  <ButtonBase
                    {...mergePartProps<ButtonBaseProps>({ sx: stepsStyles.trigger }, propsTrigger, {
                      onClick: () => onStepChange(index),
                    })}
                  >
                    {content}
                  </ButtonBase>
                ) : (
                  content
                )}
                {!vertical && index < items.length - 1 && (
                  <span
                    {...mergeAttrs<'span'>({ sx: stepsStyles.connector }, propsConnector, {
                      sx: index < current && stepsStyles.connectorDone,
                      'aria-hidden': true,
                    })}
                  />
                )}
              </li>
            );
          })}
        </FlexOrderedList>
      );
    },
);
