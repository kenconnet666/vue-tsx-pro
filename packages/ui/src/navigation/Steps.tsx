/**
 * 步骤条（ol）：多步流程里的位置（下单、注册、配置向导）。当前步骤带 aria-current="step"，
 * 已完成的步骤显示对勾（Lucide 的 Check），出错的步骤显示警示图标。
 *
 *   <Steps current={1} items={[{ title: '填写信息' }, { title: '确认订单' }, { title: '完成' }]} />
 *   <Steps current={step} items={items} onStepChange={(index) => (step = index)} />   已完成的步骤可以点回去
 */
import { Check, CircleAlert } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { focusRingStyles, listStyles } from '../utils/styles';

/** 步骤条方向 */
export interface StepsOrientations {
  /** 横排（默认） */
  horizontal: unknown;
  /** 竖排：步骤多、说明长时 */
  vertical: unknown;
}

/** 一个步骤 */
export interface StepItem {
  /** 标题 */
  title: VNodeChild;
  /** 说明（标题下面的小字） */
  description?: VNodeChild;
  /** 出错：显示警示图标与危险色 */
  error?: boolean;
  /** 不可点回（即使已完成） */
  disabled?: boolean;
}

/** 步骤的状态：已完成、当前、未开始、出错 */
type StepState = 'complete' | 'current' | 'upcoming' | 'error';

/** 未声明的属性落到 ol 上；aria-label 是步骤条的名称 */
export interface StepsProps extends PartProps<'ol'> {
  /** 步骤 */
  items: readonly StepItem[];
  /** 当前步骤的序号，从 0 开始 */
  current: number;
  /** 方向，默认 horizontal */
  orientation?: keyof StepsOrientations;
  /** 给了就可以点击已完成的步骤回去（参数是序号） */
  onStepChange?: (index: number) => void;
  /** 每个步骤（li）的部件属性，可以按项计算 */
  propsItem?: PartProps<'li'> | ((item: StepItem, index: number) => PartProps<'li'>);
  /** 序号圆圈的部件属性 */
  propsIndicator?: PartProps<'span'>;
  /** 可点回的步骤外层按钮的部件属性 */
  propsTrigger?: PartProps<'button', 'type'>;
  /** 文字区（标题与说明的容器）的部件属性 */
  propsText?: PartProps<'span'>;
  /** 标题的部件属性 */
  propsTitle?: PartProps<'span'>;
  /** 说明的部件属性 */
  propsDescription?: PartProps<'span'>;
  /** 步骤之间连接线的部件属性 */
  propsConnector?: PartProps<'span'>;
}

const styles = stylex.create({
  root: { display: 'flex', gap: '_sm' },
  vertical: { flexDirection: 'column', gap: '_lg' },
  item: {
    display: 'flex',
    flexGrow: 1,
    flexBasis: 0,
    alignItems: 'flex-start',
    gap: '_sm',
    minWidth: 0,
  },
  // 可点回的步骤：整块是按钮
  trigger: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '_sm',
    padding: 0,
    borderWidth: 0,
    borderRadius: '_sm',
    backgroundColor: 'transparent',
    color: 'inherit',
    font: 'inherit',
    textAlign: 'start',
    cursor: 'pointer',
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
    fontSize: '_sm',
    fontWeight: '_semibold',
  },
  text: { display: 'grid', gap: '_xs', paddingTop: '0.3em', minWidth: 0 },
  title: { fontWeight: '_medium' },
  description: { color: '_textMuted', fontSize: '_sm' },
  // 步骤之间的连接线：横排在标题右侧延伸
  connector: {
    flexGrow: 1,
    alignSelf: 'center',
    minWidth: '_space.lg',
    height: '_borderWidths.xs',
    backgroundColor: '_border',
  },
  connectorDone: { backgroundColor: '_accent' },
});

const stateStyles = stylex.create({
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
        <ol
          {...elementProps(
            mergeProps<'ol'>(
              { sx: [listStyles.reset, styles.root, vertical && styles.vertical] },
              rest,
            ),
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
                {...elementProps(
                  mergeProps<'span'>({ sx: styles.indicator }, propsIndicator, {
                    sx: stateStyles[state],
                    'aria-hidden': true,
                  }),
                )}
              >
                {state === 'complete' ? (
                  <Icon icon={Check} />
                ) : state === 'error' ? (
                  <Icon icon={CircleAlert} />
                ) : (
                  index + 1
                )}
              </span>,
              <span {...elementProps(mergeProps<'span'>({ sx: styles.text }, propsText))}>
                <span {...elementProps(mergeProps<'span'>({ sx: styles.title }, propsTitle))}>
                  {item.title}
                </span>
                {item.description != null && (
                  <span
                    {...elementProps(
                      mergeProps<'span'>({ sx: styles.description }, propsDescription),
                    )}
                  >
                    {item.description}
                  </span>
                )}
              </span>,
            ];
            const clickable = onStepChange && state === 'complete' && !item.disabled;
            return (
              <li
                key={index}
                {...elementProps(
                  mergeProps<'li'>({ sx: styles.item }, own, {
                    'aria-current': state === 'current' ? 'step' : undefined,
                  }),
                )}
                data-state={state}
              >
                {clickable ? (
                  <button
                    {...elementProps(
                      mergeProps<'button'>(
                        { sx: [styles.trigger, focusRingStyles.visible] },
                        propsTrigger,
                        { type: 'button', onClick: () => onStepChange(index) },
                      ),
                    )}
                  >
                    {content}
                  </button>
                ) : (
                  content
                )}
                {!vertical && index < items.length - 1 && (
                  <span
                    {...elementProps(
                      mergeProps<'span'>({ sx: styles.connector }, propsConnector, {
                        sx: index < current && styles.connectorDone,
                        'aria-hidden': true,
                      }),
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      );
    },
);
