/**
 * 步骤条：一件事分几步，标出已完成、进行中、未开始（下单流程、物流进度）。横排放标题；竖排可带说明与时间，常用于物流。
 *
 *   <Steps active={1} items={[{ title: '下单' }, { title: '付款' }, { title: '发货' }, { title: '收货' }]} />
 *   <Steps direction="vertical" active={0} items={[{ title: '已签收', description: '2026-10-30 09:12' }, …]} />
 */
import { Check, X } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { t } from '../theme/tokens';
import { dataAttrs, hasContent, mergeAttrs, type PartProps } from '../utils/props';

/** 一步的状态 */
export interface StepStatuses {
  /** 已完成：对勾 */
  done: unknown;
  /** 进行中：实心的主色圆点 */
  process: unknown;
  /** 未开始：灰色圆点 */
  wait: unknown;
  /** 出错：叉 */
  error: unknown;
}

/** 一步 */
export interface StepItem {
  /** 标题 */
  title: VNodeChild;
  /** 说明（竖排时显示在标题下面） */
  description?: VNodeChild;
  /** 状态；不给时按 active 算 */
  status?: keyof StepStatuses;
}

/** 未声明的属性落到根元素（div）上 */
export interface StepsProps extends PartProps<'div', 'role'> {
  /** 各步 */
  items: StepItem[];
  /**
   * 当前是第几步（从 0 开始）：之前的是已完成，这一步是进行中
   * @default 0
   */
  active?: number;
  /**
   * 方向
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical';
  /** 每一步的部件属性 */
  propsItem?: PartProps<'div'>;
}

/** Steps 的样式 */
export const stepsStyles = css.create({
  root: { display: 'flex', paddingBlock: '_md', paddingInline: '_sm', backgroundColor: '_surface' },
  vertical: { flexDirection: 'column', paddingInline: '_lg' },
  item: {
    position: 'relative',
    flex: '1 1 0',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.4em',
    fontSize: '_xs',
    textAlign: 'center',
    color: {
      default: '_textMuted',
      '[data-status="process"]': '_accentText',
      '[data-status="done"]': '_text',
      '[data-status="error"]': '_dangerText',
    },
  },
  itemVertical: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '_md',
    paddingBlockEnd: '1.2em',
    textAlign: 'start',
    fontSize: '_sm',
  },
  // 连接线：横排在圆点中线上、从这一步的中心连到下一步的中心；竖排在圆点下面
  line: {
    position: 'absolute',
    insetBlockStart: '0.65em',
    insetInlineStart: '50%',
    width: '100%',
    height: t.borderWidths.hairline,
    backgroundColor: { default: '_border', '[data-done]': '_accent' },
  },
  lineVertical: {
    insetBlockStart: '1.4em',
    insetBlockEnd: '-0.1em',
    insetInlineStart: '0.65em',
    width: t.borderWidths.hairline,
    height: 'auto',
  },
  dot: {
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: 1,
    flex: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.3em',
    height: '1.3em',
    borderRadius: '_full',
    color: '_accentContrast',
    fontSize: '1em',
  },
  wait: {
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderStrong',
    backgroundColor: '_surface',
  },
  process: { backgroundColor: '_accent', boxShadow: `0 0 0 0.25em ${t.colors.accentSoft}` },
  done: { backgroundColor: '_accent' },
  error: { backgroundColor: '_danger', color: '_dangerContrast' },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2em',
    minWidth: 0,
    overflowWrap: 'anywhere',
  },
  title: { lineHeight: '1.4' },
  description: { fontSize: '_xs', color: '_textMuted' },
});

/** 步骤条（div[role=list] > 各步） */
export const Steps = _component(
  ({ items, active = 0, direction = 'horizontal', propsItem, ...rest }: StepsProps) =>
    () => {
      const vertical = direction === 'vertical';
      return (
        <div
          {...mergeAttrs<'div'>(
            { sx: [stepsStyles.root, vertical && stepsStyles.vertical] },
            rest,
            {
              role: 'list',
            },
          )}
        >
          {items.map((item, index) => {
            const status =
              item.status ?? (index < active ? 'done' : index === active ? 'process' : 'wait');
            const last = index === items.length - 1;
            return (
              <div
                {...mergeAttrs<'div'>(
                  { sx: [stepsStyles.item, vertical && stepsStyles.itemVertical] },
                  propsItem,
                  {
                    role: 'listitem',
                    'aria-current': status === 'process' ? 'step' : undefined,
                    ...dataAttrs({ 'data-status': status }),
                  },
                )}
              >
                {!last && (
                  <span
                    {...mergeAttrs<'span'>(
                      { sx: [stepsStyles.line, vertical && stepsStyles.lineVertical] },
                      dataAttrs({ 'data-done': status === 'done' }),
                    )}
                  />
                )}
                <span {...mergeAttrs<'span'>({ sx: [stepsStyles.dot, stepsStyles[status]] })}>
                  {status === 'done' && <Icon icon={Check} strokeWidth={3} size={11} />}
                  {status === 'error' && <Icon icon={X} strokeWidth={3} size={11} />}
                </span>
                <span {...mergeAttrs<'span'>({ sx: stepsStyles.body })}>
                  <span {...mergeAttrs<'span'>({ sx: stepsStyles.title })}>{item.title}</span>
                  {vertical && hasContent(item.description) && (
                    <span {...mergeAttrs<'span'>({ sx: stepsStyles.description })}>
                      {item.description}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      );
    },
);
