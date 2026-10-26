/**
 * 完成清单：一组要做完的事，每项的状态（完成、待办、超时、不适用、受阻）与它的上下文——怎么做、谁负责、哪天、证据、去处理。
 * 里程碑与交付证据、结项材料、上线检查、新用户的引导任务。参考 Shopify Polaris 的 Setup guide、GitHub 的任务列表。
 *
 *   <Checklist
 *     title="结项材料"
 *     summary
 *     items={[
 *       { label: '验收报告', status: 'done', date: '10-12', evidence: <Link href={url}>验证报告.pdf</Link> },
 *       { label: '财务复核意见', status: 'overdue', owner: '财务部', date: '计划 10-20', action: <Button>催办</Button> },
 *       { label: '合同签订记录', description: '谈定价格与生效日期，采购经理签字', owner: '采购部' },
 *     ]}
 *   />
 *   <Checklist layout="inline" items={…} />                    一行排开、放不下换行（详情行、卡片的一角）
 *   <Checklist layout="icons" aria-label="里程碑" items={…} />  只有一排状态图标（表格的格子里），读屏念每一项
 *   <Checklist items={tasks} onCheckedChange={(item, done) => save(item.key, done)} />   可以勾选（上线检查、引导任务）
 *
 * summary 在上面显示“已完成 2 / 3”与进度条（不适用的不算）。没完成的名称是次要色，不适用的划掉；
 * 超时的日期用危险色。每项的状态写在给读屏的文字里。
 *
 * 部件：Root（div）、Summary（汇总行）、List（ul）、Item（li，可以按项计算）、Status（状态图标，可勾选时是按钮）、Label、Meta。
 */
import { Ban, CircleAlert, CircleCheck, CircleDashed, CircleMinus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { useId, type VNodeChild } from 'vue';
import { Icon, type IconData } from '../base/Icon';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { Progress } from '../feedback/Progress';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';

/** 一项的状态 */
export interface ChecklistStatuses {
  /** 完成 */
  done: unknown;
  /** 待办（默认） */
  todo: unknown;
  /** 超时：过了计划日期还没完成 */
  overdue: unknown;
  /** 受阻：等别人、缺前提 */
  blocked: unknown;
  /** 不适用：这一次不用做，不算进进度 */
  skipped: unknown;
}

/** 清单的一项 */
export interface ChecklistItem {
  /** 唯一的 key；不写时用 label（label 是文字时）或位置 */
  key?: string;
  /** 名称 */
  label: VNodeChild;
  /** 状态，默认 todo */
  status?: keyof ChecklistStatuses;
  /** 说明：怎么做、要什么材料、缺的由谁出具 */
  description?: VNodeChild;
  /** 负责人（谁处理、谁出具） */
  owner?: VNodeChild;
  /** 日期：完成的日期，或计划日期（超时时用危险色） */
  date?: VNodeChild;
  /** 证据：附件、报告的链接 */
  evidence?: VNodeChild;
  /** 操作：上传证据、去处理、催办（结束边） */
  action?: VNodeChild;
}

/** 清单的排法 */
export interface ChecklistLayouts {
  /** 一项一行（默认）：状态、名称与说明、负责人 · 日期 · 证据，操作在结束边 */
  list: unknown;
  /** 一行排开、放不下换行：状态、名称、日期、证据 */
  inline: unknown;
  /** 只有一排状态图标：表格的格子里；悬停与读屏有每一项的说明 */
  icons: unknown;
}

/** 未声明的属性落到外层元素上（list 是 div，inline 是 ul，icons 是 span） */
export interface ChecklistProps extends PartProps<'div'> {
  /** 各项 */
  items: readonly ChecklistItem[];
  /**
   * 排法
   * @default 'list'
   */
  layout?: keyof ChecklistLayouts;
  /** 上面显示“已完成 2 / 3”与进度条（list 排法） */
  summary?: boolean;
  /** 字号档位；不写时继承 */
  size?: TextSize;
  /** 可以勾选：状态图标变成复选按钮，点了报告新的完成状态（不适用、受阻的不能勾） */
  onCheckedChange?: (item: ChecklistItem, done: boolean) => void;
  /** 每一项（li）的部件属性，可以按项计算 */
  propsItem?: PartProps<'li'> | ((item: ChecklistItem) => PartProps<'li'>);
}

/** Checklist 的样式 */
export const checklistStyles = css.create({
  root: { display: 'grid', gap: '_sm' },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    alignItems: 'center',
    gap: '_md',
    fontSize: '_sm',
    color: '_textMuted',
  },
  list: { display: 'grid', margin: 0, padding: 0, listStyle: 'none' },
  // 状态一列、内容一列、操作一列；状态贴着名称那一行
  item: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    columnGap: '_sm',
    alignItems: 'start',
    paddingBlock: '_xs',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    minHeight: '1lh',
    fontSize: '1.125em',
  },
  // 可以勾选时的按钮：只有图标，去掉按钮的外观
  toggle: {
    display: 'inline-flex',
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: 'inherit',
    font: 'inherit',
    borderRadius: '_full',
    cursor: { default: 'pointer', ':disabled': 'default' },
  },
  body: { display: 'grid', gap: '2px', minWidth: 0 },
  label: { color: '_text', overflowWrap: 'anywhere' },
  labelPending: { color: '_textMuted' },
  labelSkipped: { color: '_textMuted', textDecorationLine: 'line-through' },
  description: { fontSize: '_sm', color: '_textMuted' },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: '_sm',
    rowGap: '2px',
    fontSize: '_sm',
    color: '_textMuted',
  },
  late: { color: '_dangerText' },
  action: { display: 'flex', alignItems: 'center', gap: '_xs' },
  inline: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: '_lg',
    rowGap: '_xs',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  inlineItem: { display: 'inline-flex', alignItems: 'center', gap: '_xs', whiteSpace: 'nowrap' },
  icons: { display: 'inline-flex', alignItems: 'center', gap: '2px' },
});

/** 各状态的图标与颜色 */
export const checklistStatusStyles = css.create({
  done: { color: '_successText' },
  todo: { color: '_textMuted' },
  overdue: { color: '_dangerText' },
  blocked: { color: '_warningText' },
  skipped: { color: '_textMuted' },
});

const statusIcons: Record<keyof ChecklistStatuses, IconData> = {
  done: CircleCheck,
  todo: CircleDashed,
  overdue: CircleAlert,
  blocked: Ban,
  skipped: CircleMinus,
};

const keyOf = (item: ChecklistItem, index: number) =>
  item.key ?? (typeof item.label === 'string' ? item.label : String(index));

const statusOf = (item: ChecklistItem): keyof ChecklistStatuses => item.status ?? 'todo';

/** 完成清单 */
export const Checklist = _component(
  ({
    items,
    layout = 'list',
    summary = false,
    size,
    onCheckedChange,
    propsItem,
    ...rest
  }: ChecklistProps) => {
    const lang = useLang();
    const id = useId();

    const statusIcon = (item: ChecklistItem) => {
      const status = statusOf(item);
      return <Icon icon={statusIcons[status]} sx={checklistStatusStyles[status]} />;
    };

    /** 状态：可以勾选时是复选按钮（名称是这一项的名称），否则是图标加给读屏的状态文字 */
    const status = (item: ChecklistItem, labelId: string) => {
      const state = statusOf(item);
      if (!onCheckedChange)
        return (
          <span {...css.attrs(checklistStyles.status)}>
            {statusIcon(item)}
            <VisuallyHidden>{lang.checklistStatus[state]}</VisuallyHidden>
          </span>
        );
      const done = state === 'done';
      return (
        <span {...css.attrs(checklistStyles.status)}>
          <button
            type="button"
            role="checkbox"
            aria-checked={done}
            aria-labelledby={labelId}
            aria-describedby={`${labelId}-status`}
            disabled={state === 'skipped' || state === 'blocked'}
            onClick={() => onCheckedChange(item, !done)}
            {...css.attrs(checklistStyles.toggle, focusRingStyles.visible)}
          >
            {statusIcon(item)}
          </button>
          <VisuallyHidden id={`${labelId}-status`}>{lang.checklistStatus[state]}</VisuallyHidden>
        </span>
      );
    };

    const labelSx = (item: ChecklistItem) => {
      const state = statusOf(item);
      return [
        checklistStyles.label,
        state === 'skipped'
          ? checklistStyles.labelSkipped
          : state !== 'done' && checklistStyles.labelPending,
      ];
    };

    /** 读屏念的整组：名称与状态（icons 排法） */
    const iconsLabel = () =>
      lang.checklistIconsLabel(
        items.map((item) =>
          lang.checklistItemState(
            typeof item.label === 'string' ? item.label : '',
            lang.checklistStatus[statusOf(item)],
          ),
        ),
      );

    const counted = () => items.filter((item) => statusOf(item) !== 'skipped');
    const doneCount = () => counted().filter((item) => statusOf(item) === 'done').length;

    return () => {
      if (layout === 'icons') {
        const label = iconsLabel();
        return (
          <span
            {...mergeAttrs<'span'>(
              { sx: [checklistStyles.icons, size && fontSizeStyles[size]] },
              rest as PartProps<'span'>,
              { role: 'img', 'aria-label': label, title: label },
            )}
          >
            {items.map((item, index) => (
              <span key={keyOf(item, index)}>{statusIcon(item)}</span>
            ))}
          </span>
        );
      }

      if (layout === 'inline')
        return (
          <ul
            {...mergeAttrs<'ul'>(
              { sx: [checklistStyles.inline, size && fontSizeStyles[size]] },
              rest as PartProps<'ul'>,
            )}
          >
            {items.map((item, index) => {
              const labelId = `${id}-${index}`;
              return (
                <li key={keyOf(item, index)} {...css.attrs(checklistStyles.inlineItem)}>
                  {status(item, labelId)}
                  <span id={labelId} {...css.attrs(labelSx(item))}>
                    {item.label}
                  </span>
                  {hasContent(item.date) && (
                    <span
                      {...css.attrs(
                        checklistStyles.meta,
                        statusOf(item) === 'overdue' && checklistStyles.late,
                      )}
                    >
                      {item.date}
                    </span>
                  )}
                  {item.evidence}
                </li>
              );
            })}
          </ul>
        );

      const total = counted().length;
      return (
        <div
          {...mergeAttrs<'div'>({ sx: [checklistStyles.root, size && fontSizeStyles[size]] }, rest)}
        >
          {summary && total > 0 && (
            <div {...css.attrs(checklistStyles.summary)}>
              <span>{lang.checklistSummary(doneCount(), total)}</span>
              <Progress
                value={doneCount()}
                max={total}
                size="xs"
                tone={doneCount() === total ? 'success' : 'accent'}
                aria-label={lang.checklistSummary(doneCount(), total)}
              />
            </div>
          )}
          <ul {...css.attrs(checklistStyles.list)}>
            {items.map((item, index) => {
              const own = typeof propsItem === 'function' ? propsItem(item) : propsItem;
              const labelId = `${id}-${index}`;
              const meta = [item.owner, item.date, item.evidence].some(hasContent);
              return (
                <li
                  key={keyOf(item, index)}
                  {...mergeAttrs<'li'>({ sx: checklistStyles.item }, own)}
                  data-status={statusOf(item)}
                >
                  {status(item, labelId)}
                  <div {...css.attrs(checklistStyles.body)}>
                    <span id={labelId} {...css.attrs(labelSx(item))}>
                      {item.label}
                    </span>
                    {hasContent(item.description) && (
                      <span {...css.attrs(checklistStyles.description)}>{item.description}</span>
                    )}
                    {meta && (
                      <span {...css.attrs(checklistStyles.meta)}>
                        {hasContent(item.owner) && <span>{item.owner}</span>}
                        {hasContent(item.date) && (
                          <span
                            {...css.attrs(statusOf(item) === 'overdue' && checklistStyles.late)}
                          >
                            {item.date}
                          </span>
                        )}
                        {item.evidence}
                      </span>
                    )}
                  </div>
                  {hasContent(item.action) ? (
                    <div {...css.attrs(checklistStyles.action)}>{item.action}</div>
                  ) : (
                    <span />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      );
    };
  },
);
