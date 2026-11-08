/**
 * 看板：一列一个状态（或阶段、负责人），卡片在列之间移动。任务看板、招聘流程、工单。
 *
 *   <KanbanBoard
 *     aria-label="任务看板"
 *     columns={[{ key: 'designing', label: '设计中' }, { key: 'verifying', label: '测试中' }]}
 *     items={tasks}
 *     getKey={(task) => task.code}
 *     getColumn={(task) => task.status}
 *     getLabel={(task) => task.name}
 *     canMove={(task, to) => (to === next(task.status) ? null : '只能拖到下一列')}
 *     onMove={(task, to) => openProcessDialog(task, to)}
 *   >
 *     {(task) => <TaskCard task={task} />}
 *   </KanbanBoard>
 *
 * 数据由使用方控制：看板不自己挪卡片，只在放下时报告 onMove（使用方处理完、刷新数据，卡片才换列）。
 * canMove 返回不能移动的原因（null 是可以）：拖动时经过的列按它高亮（可以放的是强调色，不能放的标红并写出原因），
 * 落点处画一条插入线；放在不能放的列上时卡片弹回、读屏播报原因，并报告 onReject。
 * 给了 onReorder 时列内也能排序（数据立即重排，写回整个数组）。
 *
 * 拖动、键盘、读屏播报、自动滚动建在 useSortable 的分组上（utils/dom/sortable.ts）：
 * - 指针：在卡片上按下拖动超过 3px 开始（点在卡片里的链接、按钮上不算），影子卡跟着指针走，原位留着变淡的占位；
 * - 键盘：每张卡片有把手按钮，空格 / Enter 拿起，← / → 换列（从右到左排版下镜像），↑ / ↓ 调整位置，
 *   空格 / Enter 放下，Esc 取消；每一步都有读屏播报（aria-live）。
 * 列多时整块横向滚动（ScrollArea），每列里的卡片多时列自己竖向滚动。
 *
 * 部件（data-scope="kanban-board"）：Root（div）、Board（各列的横排）、Column（section，可以按列计算）、Header、Title、
 * Count（Badge）、Reason（不能放的原因）、List（ul）、Empty、Card（li，可以按卡片计算）、Handle（ButtonBase）、
 * Indicator（插入线）、Ghost（跟着指针的影子卡）。
 */
import { GripVertical } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Badge, type BadgeProps } from '../base/Badge';
import { useMessages } from '../config/lang/messages';
import { patternsMessages } from './messages';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { Icon } from '../base/Icon';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { partAttrs } from '../config/styles';
import { ScrollArea } from '../layout/ScrollArea';
import { useSortable } from '../utils/dom/sortable';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import type { StatusTone } from '../utils/style/tone-styles';
import { t } from '../config/theme/tokens';

/** 看板的一列 */
export interface KanbanColumn {
  /** 列的标识：getColumn 返回它 */
  key: string;
  /** 列名 */
  label: string;
  /** 列名旁计数的色调（超时、异常这类要注意的列） */
  tone?: StatusTone;
}

/** 卡片的渲染状态 */
export interface KanbanCardState {
  /** 正在被拖动或被键盘拿起 */
  dragging: boolean;
}

/** 未声明的属性落到外层 div 上；aria-label 是看板的名称 */
export interface KanbanBoardProps<T> extends PartProps<'div'> {
  /** 各列：从起始边排 */
  columns: readonly KanbanColumn[];
  /** 全部卡片的数据 */
  items: readonly T[];
  /** 卡片的标识 */
  getKey: (item: T) => string;
  /** 卡片在哪一列 */
  getColumn: (item: T) => string;
  /** 卡片的名称：把手的名称、读屏播报；默认是 key */
  getLabel?: (item: T) => string;
  /** 能不能移到 to 列：返回不能的原因，null、undefined 是可以 */
  canMove?: (item: T, to: string) => string | null | undefined;
  /** 放到了可以放的列：使用方处理（打开处理的对话框、调接口），完成后刷新数据；index 是在目标列里的位置 */
  onMove: (item: T, to: string, index: number) => void;
  /** 列内排序：写回新的数组（所有列的卡片）；不给时列内不能排序 */
  onReorder?: (items: T[]) => void;
  /** 放到了不能放的列：卡片已经弹回，可以在这里提示原因 */
  onReject?: (item: T, to: string, reason: string) => void;
  /**
   * 每列至少多宽（CSS 长度）：放得下时各列平分整行，放不下时横向滚动
   * @default '16rem'
   */
  columnWidth?: string;
  /**
   * 每列的最大高度（CSS 长度）：卡片多时列里竖向滚动
   * @default '70vh'
   */
  columnHeight?: string;
  /** 一列没有卡片时显示的内容，默认“没有” */
  empty?: VNodeChild;
  /** 卡片的内容 */
  children: (item: T, state: KanbanCardState) => VNodeChild;
  /** 各列横排那一层的部件属性 */
  propsBoard?: PartProps<'div'>;
  /** 每一列（section）的部件属性，可以按列计算 */
  propsColumn?: PartProps<'section'> | ((column: KanbanColumn) => PartProps<'section'>);
  /** 列头（名称与数量）的部件属性 */
  propsHeader?: PartProps<'div'>;
  /** 列头数量（Badge）的部件属性 */
  propsCount?: Partial<BadgeProps>;
  /** 不能放时列头下面的原因的部件属性 */
  propsReason?: PartProps<'div'>;
  /** 卡片列表（ul）的部件属性 */
  propsList?: PartProps<'ul'>;
  /** 空列的提示的部件属性 */
  propsEmpty?: PartProps<'li'>;
  /** 每张卡片（li）的部件属性，可以按卡片计算 */
  propsCard?: PartProps<'li'> | ((item: T, state: KanbanCardState) => PartProps<'li'>);
  /** 卡片的拖动把手（ButtonBase）的部件属性 */
  propsHandle?: Partial<ButtonBaseProps>;
}

/** KanbanBoard 的样式：board、column、header、list、card、handle… */
const kanbanBoardStyles = css.create({
  board: { display: 'flex', gap: '_md', alignItems: 'flex-start', paddingBlockEnd: '_sm' },
  column: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    borderRadius: '_lg',
    backgroundColor: '_surfaceMuted',
    outlineWidth: '_borderWidths.sm',
    outlineStyle: 'solid',
    outlineColor: 'transparent',
    outlineOffset: `calc(-1 * ${t.borderWidths.sm})`,
    transition: `outline-color ${t.durations.sm} ${t.easings.standard}`,
  },
  allowed: { outlineColor: '_accent' },
  denied: { outlineColor: '_danger' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '_sm',
    paddingBlock: '_sm',
    paddingInline: '_md',
    fontWeight: '_medium',
    fontSize: '_sm',
  },
  reason: { paddingInline: '_md', paddingBlockEnd: '_xs', color: '_dangerText', fontSize: '_xs' },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_sm',
    margin: 0,
    paddingInline: '_sm',
    paddingBlockEnd: '_sm',
    listStyle: 'none',
    minHeight: '3rem',
  },
  card: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'start',
    gap: '_xs',
    padding: '_sm',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    backgroundColor: '_surfaceRaised',
    cursor: 'grab',
    touchAction: 'none',
    transition: `translate ${t.durations.md} ${t.easings.standard}`,
  },
  // 指针拖动中：原位的卡片变淡，跟着指针走的是影子卡（画在滚动区域外面，不被列裁掉）
  placeholder: { opacity: 0.4 },
  ghost: {
    position: 'fixed',
    zIndex: 50,
    pointerEvents: 'none',
    cursor: 'grabbing',
    boxShadow: '_lg',
    transition: 'none',
    rotate: '1.5deg',
  },
  // 键盘拿起：高亮边框
  lifted: { borderColor: '_accent', boxShadow: '_md' },
  // 拖动把手：悬停同幽灵按钮（底色、文字色加深）
  handle: {
    color: { default: '_textMuted', _hover: '_text' },
    backgroundColor: { default: 'transparent', _hover: '_fillHover' },
    borderRadius: '_sm',
    padding: '_xxs',
    cursor: 'grab',
  },
  empty: { color: '_textMuted', fontSize: '_xs', paddingBlock: '_sm', textAlign: 'center' },
  // 拖到别的列时的落点：卡片之间的一条线
  indicator: {
    height: '_borderWidths.md',
    marginBlock: `calc(-1 * ${t.space.xs})`,
    borderRadius: '_full',
    backgroundColor: '_accent',
  },
  indicatorDenied: { backgroundColor: '_danger' },
});

/** KanbanBoard 的动态样式：列宽、列高、拖动的位移 */
const kanbanBoardDynamicStyles = css.create({
  // 至少这么宽，富余的空间各列平分（同 Jira 的看板），放不下时外层横向滚动
  width: (width: string) => ({ flexBasis: width, flexGrow: 1, minWidth: width }),
  height: (height: string) => ({ maxHeight: height }),
  ghost: (left: number, top: number, width: number) => ({ left, top, width }),
});

/** 部件的标记（data-scope="kanban-board"） */
const kanbanPart = (part: string) => partAttrs({ name: 'KanbanBoard' }, part);

/** 看板 */
export const KanbanBoard = _component(
  <T,>({
    columns,
    items,
    getKey,
    getColumn,
    getLabel,
    canMove,
    onMove,
    onReorder,
    onReject,
    columnWidth = '16rem',
    columnHeight = '70vh',
    empty,
    children,
    propsBoard,
    propsColumn,
    propsHeader,
    propsCount,
    propsReason,
    propsList,
    propsEmpty,
    propsCard,
    propsHandle,
    ...rest
  }: KanbanBoardProps<T>) => {
    const lang = useLang();
    const messages = useMessages('patterns', patternsMessages);
    let board = _state.raw<HTMLElement | null>(null);
    const labelOf = (item: T) => getLabel?.(item) ?? getKey(item);
    const itemOf = (key: string) => items.find((item) => getKey(item) === key);
    const sortable = useSortable({
      items: () => items,
      getKey: (item) => getKey(item),
      getLabel: labelOf,
      // 用时再读属性：写没写 onReorder 决定了列内能不能排序，父级后来才给也要跟上
      get onChange() {
        return onReorder && ((next: T[]) => onReorder(next));
      },
      container: () => board,
      groups: {
        keys: () => columns.map((column) => column.key),
        of: (item) => getColumn(item),
        label: (key) => columns.find((column) => column.key === key)?.label ?? key,
        canMove: (item, to) => canMove?.(item, to),
        onMove: (item, to, index) => onMove(item, to, index),
        onReject: (item, to, reason) => onReject?.(item, to, reason),
      },
    });

    /** 整张卡片都能拖：卡片里的链接、按钮（把手除外）、输入框照常点 */
    function onPointerdown(event: PointerEvent, key: string) {
      const target = event.target as Element;
      if (target.closest('a, input, select, textarea, button:not([data-handle])')) return;
      (sortable.handleProps(key).onPointerdown as (event: PointerEvent) => void)(event);
    }

    return () => {
      const dragging = sortable.active;
      const drop = sortable.target;
      const ghost = sortable.ghost;
      const ghostItem = ghost && itemOf(ghost.key);
      const draggedItem = dragging === undefined ? undefined : itemOf(dragging);
      const draggedFrom = draggedItem === undefined ? undefined : getColumn(draggedItem);
      return (
        <div {...mergeAttrs<'div'>({}, rest, { role: 'group', ...kanbanPart('root') })}>
          <ScrollArea axis="x">
            <div
              {...mergeAttrs<'div'>(
                { sx: kanbanBoardStyles.board, ...kanbanPart('board') },
                propsBoard,
                {
                  ref: (element: unknown) =>
                    (board = element instanceof HTMLElement ? element : null),
                },
              )}
            >
              {columns.map((column) => {
                const cards = items.filter((item) => getColumn(item) === column.key);
                // 拖到了别的列：高亮这一列，在落点画线
                const over = drop && draggedFrom !== column.key && drop.group === column.key;
                const reason = over ? drop.reason : null;
                const headingId = `${sortable.instructionsId}-${column.key}`;
                const indicator = (
                  <li
                    key="drop-indicator"
                    aria-hidden="true"
                    {...css.attrs(
                      kanbanBoardStyles.indicator,
                      reason != null && kanbanBoardStyles.indicatorDenied,
                    )}
                    {...kanbanPart('indicator')}
                  />
                );
                return (
                  <section
                    key={column.key}
                    {...mergeAttrs<'section'>(
                      {
                        sx: [
                          kanbanBoardStyles.column,
                          kanbanBoardDynamicStyles.width(columnWidth),
                          over && (reason ? kanbanBoardStyles.denied : kanbanBoardStyles.allowed),
                        ],
                        ...kanbanPart('column'),
                      },
                      typeof propsColumn === 'function' ? propsColumn(column) : propsColumn,
                      { 'aria-labelledby': headingId, ...sortable.groupProps(column.key) },
                    )}
                  >
                    <div
                      {...mergeAttrs<'div'>(
                        { sx: kanbanBoardStyles.header, ...kanbanPart('header') },
                        propsHeader,
                      )}
                    >
                      <span id={headingId} {...kanbanPart('title')}>
                        {column.label}
                      </span>
                      <Badge
                        {...mergePartProps<BadgeProps>(
                          {
                            radius: 'full',
                            tone: cards.length > 0 ? (column.tone ?? 'neutral') : 'neutral',
                            ...kanbanPart('count'),
                          },
                          propsCount,
                        )}
                      >
                        {cards.length}
                      </Badge>
                    </div>
                    {reason && (
                      <div
                        {...mergeAttrs<'div'>(
                          { sx: kanbanBoardStyles.reason, ...kanbanPart('reason') },
                          propsReason,
                        )}
                      >
                        {reason}
                      </div>
                    )}
                    <ScrollArea sx={kanbanBoardDynamicStyles.height(columnHeight)}>
                      <ul
                        {...mergeAttrs<'ul'>(
                          { sx: kanbanBoardStyles.list, ...kanbanPart('list') },
                          propsList,
                        )}
                      >
                        {cards.length === 0 && !over && (
                          <li
                            {...mergeAttrs<'li'>(
                              { sx: kanbanBoardStyles.empty, ...kanbanPart('empty') },
                              propsEmpty,
                            )}
                          >
                            {empty ?? messages.kanbanEmpty}
                          </li>
                        )}
                        {cards.flatMap((item, index) => {
                          const key = getKey(item);
                          const active = dragging === key;
                          const { onPointerdown: _, ...handle } = sortable.handleProps(key);
                          const state = { dragging: active };
                          const card = (
                            <li
                              key={key}
                              {...mergeAttrs<'li'>(
                                {
                                  sx: [
                                    kanbanBoardStyles.card,
                                    active && ghost && kanbanBoardStyles.placeholder,
                                    active && !ghost && kanbanBoardStyles.lifted,
                                  ],
                                  ...kanbanPart('card'),
                                },
                                typeof propsCard === 'function'
                                  ? propsCard(item, state)
                                  : propsCard,
                                {
                                  ...sortable.itemProps(key),
                                  onPointerdown: (event: PointerEvent) => onPointerdown(event, key),
                                },
                              )}
                              data-state={active ? 'dragging' : undefined}
                            >
                              <div>{children(item, state)}</div>
                              <ButtonBase
                                {...mergePartProps<ButtonBaseProps>(
                                  { sx: kanbanBoardStyles.handle, ...kanbanPart('handle') },
                                  propsHandle,
                                  { ...handle, 'aria-label': lang.sortableHandle(labelOf(item)) },
                                )}
                                data-handle=""
                              >
                                <Icon icon={GripVertical} />
                              </ButtonBase>
                            </li>
                          );
                          return over && drop.index === index ? [indicator, card] : [card];
                        })}
                        {over && drop.index >= cards.length && indicator}
                      </ul>
                    </ScrollArea>
                  </section>
                );
              })}
            </div>
          </ScrollArea>
          {ghost && ghostItem !== undefined && (
            <div
              aria-hidden="true"
              {...css.attrs(
                kanbanBoardStyles.card,
                kanbanBoardStyles.ghost,
                kanbanBoardDynamicStyles.ghost(ghost.left, ghost.top, ghost.width),
              )}
              {...kanbanPart('ghost')}
            >
              <div>{children(ghostItem, { dragging: true })}</div>
            </div>
          )}
          <VisuallyHidden id={sortable.instructionsId}>
            {messages.kanbanInstructions}
          </VisuallyHidden>
          <VisuallyHidden aria-live="assertive">{sortable.announcement}</VisuallyHidden>
        </div>
      );
    };
  },
);
