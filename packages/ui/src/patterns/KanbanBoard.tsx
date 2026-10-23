/**
 * 看板：一列一个状态（或阶段、负责人），卡片在列之间移动。任务看板、招聘流程、工单。
 *
 *   <KanbanBoard
 *     aria-label="任务看板"
 *     columns={[{ key: 'designing', label: '方案设计中' }, { key: 'verifying', label: '验证中' }]}
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
 * 放在不能放的列上时卡片弹回、读屏播报原因，并报告 onReject。
 *
 * - 指针：在卡片上按下拖动超过 3px 开始（点在卡片里的链接、按钮上不算），卡片跟着指针走；
 * - 键盘：每张卡片有把手按钮，空格 / Enter 拿起，← / → 换列（从右到左排版下镜像），空格 / Enter 放下，Esc 取消；
 *   每一步都有读屏播报（aria-live）。
 * 列多时整块横向滚动（ScrollArea），每列里的卡片多时列自己竖向滚动。
 */
import { GripVertical } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, type VNodeChild } from 'vue';
import { Badge } from '../base/Badge';
import { useMessages } from '../config/lang/messages';
import { patternsMessages } from './messages';
import { ButtonBase } from '../base/ButtonBase';
import { Icon } from '../base/Icon';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { ScrollArea } from '../layout/ScrollArea';
import { inlineArrows, isRtl } from '../utils/dom/direction';
import { startMove } from '../utils/dom/move';
import { mergeAttrs, type PartProps } from '../utils/props';
import type { StatusTone } from '../utils/style/tone-styles';

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
  /** 放到了可以放的列：使用方处理（打开处理的对话框、调接口），完成后刷新数据 */
  onMove: (item: T, to: string) => void;
  /** 放到了不能放的列：卡片已经弹回，可以在这里提示原因 */
  onReject?: (item: T, to: string, reason: string) => void;
  /**
   * 列宽（CSS 长度）
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
}

/** KanbanBoard 的样式：board、column、header、list、card、handle… */
export const kanbanBoardStyles = stylex.create({
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
    outlineOffset: '-2px',
    transition: 'outline-color _durations.sm _easings.standard',
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
    fontWeight: '_semibold',
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
    overflowY: 'auto',
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
    transition: 'translate _durations.md _easings.standard',
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
  handle: { color: '_textMuted', borderRadius: '_sm', padding: '2px', cursor: 'grab' },
  empty: { color: '_textMuted', fontSize: '_xs', paddingBlock: '_sm', textAlign: 'center' },
});

/** KanbanBoard 的动态样式：列宽、列高、拖动的位移 */
export const kanbanBoardDynamicStyles = stylex.create({
  width: (width: string) => ({ width }),
  height: (height: string) => ({ maxHeight: height }),
  ghost: (left: number, top: number, width: number) => ({ left, top, width }),
});

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
    onReject,
    columnWidth = '16rem',
    columnHeight = '70vh',
    empty,
    children,
    ...rest
  }: KanbanBoardProps<T>) => {
    const lang = useLang();
    const messages = useMessages('patterns', patternsMessages);
    const id = useId();
    const instructionsId = `${id}-instructions`;
    // 拖动或键盘拿起的卡片、它要去的列、指针拖动的位移
    let active = _state.raw<{ key: string; target: string; keyboard: boolean } | null>(null);
    // 指针拖动的影子卡：按下时卡片的位置与宽度，加上位移
    let ghost = _state.raw<{ left: number; top: number; width: number } | null>(null);
    let announcement = _state('');
    const columnElements = new Map<string, HTMLElement>();

    const labelOf = (item: T) => getLabel?.(item) ?? getKey(item);
    const columnLabel = (key: string) => columns.find((column) => column.key === key)?.label ?? key;
    const itemOf = (key: string) => items.find((item) => getKey(item) === key);
    const reasonFor = (item: T, to: string) =>
      to === getColumn(item) ? null : (canMove?.(item, to) ?? null);

    /** 放下：同一列什么都不做；不能放的弹回并说明原因 */
    function drop(item: T, to: string) {
      const from = getColumn(item);
      active = null;
      ghost = null;
      if (to === from) {
        announcement = messages.kanbanCancelled(labelOf(item), columnLabel(from), null);
        return;
      }
      const reason = reasonFor(item, to);
      if (reason) {
        announcement = messages.kanbanCancelled(labelOf(item), columnLabel(from), reason);
        onReject?.(item, to, reason);
        return;
      }
      announcement = messages.kanbanDropped(labelOf(item), columnLabel(to));
      onMove(item, to);
    }

    /** 指针下的列 */
    function columnAt(x: number, y: number): string | null {
      for (const [key, element] of columnElements) {
        const rect = element.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return key;
      }
      return null;
    }

    function onPointerdown(event: PointerEvent, item: T) {
      // 卡片里的链接、按钮（把手除外）照常点
      const target = event.target as Element;
      if (
        target.closest('a, input, select, textarea') ||
        target.closest('button:not([data-handle])')
      )
        return;
      const key = getKey(item);
      const start = (event.currentTarget as HTMLElement).getBoundingClientRect();
      startMove(event, {
        threshold: 3,
        onMove: ({ deltaX, deltaY, clientX, clientY }) => {
          active = { key, target: columnAt(clientX, clientY) ?? getColumn(item), keyboard: false };
          ghost = { left: start.left + deltaX, top: start.top + deltaY, width: start.width };
        },
        onEnd: ({ moved, cancelled }) => {
          if (!moved) return;
          if (cancelled || !active) {
            active = null;
            ghost = null;
            return;
          }
          drop(item, active.target);
        },
      });
    }

    function onKeydown(event: KeyboardEvent, item: T) {
      const key = getKey(item);
      const lifted = active?.key === key && active.keyboard;
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (!lifted) {
          active = { key, target: getColumn(item), keyboard: true };
          announcement = messages.kanbanGrabbed(labelOf(item), columnLabel(getColumn(item)));
        } else drop(item, active!.target);
        return;
      }
      if (!lifted) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        active = null;
        announcement = messages.kanbanCancelled(labelOf(item), columnLabel(getColumn(item)), null);
        return;
      }
      const { forward, backward } = inlineArrows(isRtl(event.currentTarget as Element));
      const step = event.key === forward ? 1 : event.key === backward ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      const index = columns.findIndex((column) => column.key === active!.target);
      const next = columns[Math.min(Math.max(index + step, 0), columns.length - 1)]!.key;
      active = { ...active!, target: next };
      announcement = messages.kanbanOver(labelOf(item), columnLabel(next), reasonFor(item, next));
    }

    return () => {
      const dragged = active ? itemOf(active.key) : undefined;
      return (
        <div {...mergeAttrs<'div'>({}, rest, { role: 'group' })}>
          <ScrollArea axis="x">
            <div {...stylex.attrs(kanbanBoardStyles.board)}>
              {columns.map((column) => {
                const cards = items.filter((item) => getColumn(item) === column.key);
                const over =
                  dragged && active!.target === column.key && getColumn(dragged) !== column.key;
                const reason = over ? reasonFor(dragged, column.key) : null;
                const headingId = `${id}-${column.key}`;
                return (
                  <section
                    key={column.key}
                    ref={(element: unknown) => {
                      if (element instanceof HTMLElement) columnElements.set(column.key, element);
                      else columnElements.delete(column.key);
                    }}
                    aria-labelledby={headingId}
                    {...stylex.attrs(
                      kanbanBoardStyles.column,
                      kanbanBoardDynamicStyles.width(columnWidth),
                      over && (reason ? kanbanBoardStyles.denied : kanbanBoardStyles.allowed),
                    )}
                    data-drop={over ? (reason ? 'denied' : 'allowed') : undefined}
                  >
                    <div {...stylex.attrs(kanbanBoardStyles.header)}>
                      <span id={headingId}>{column.label}</span>
                      <Badge
                        radius="full"
                        tone={cards.length > 0 ? (column.tone ?? 'neutral') : 'neutral'}
                      >
                        {cards.length}
                      </Badge>
                    </div>
                    {reason && <div {...stylex.attrs(kanbanBoardStyles.reason)}>{reason}</div>}
                    <ul
                      {...stylex.attrs(
                        kanbanBoardStyles.list,
                        kanbanBoardDynamicStyles.height(columnHeight),
                      )}
                    >
                      {cards.length === 0 && (
                        <li {...stylex.attrs(kanbanBoardStyles.empty)}>
                          {empty ?? messages.kanbanEmpty}
                        </li>
                      )}
                      {cards.map((item) => {
                        const key = getKey(item);
                        const dragging = active?.key === key;
                        const pointer = dragging && !active!.keyboard;
                        return (
                          <li
                            key={key}
                            {...stylex.attrs(
                              kanbanBoardStyles.card,
                              pointer && kanbanBoardStyles.placeholder,
                              dragging && active!.keyboard && kanbanBoardStyles.lifted,
                            )}
                            data-state={dragging ? 'dragging' : undefined}
                            onPointerdown={(event: PointerEvent) => onPointerdown(event, item)}
                          >
                            <div>{children(item, { dragging })}</div>
                            <ButtonBase
                              data-handle=""
                              sx={kanbanBoardStyles.handle}
                              aria-label={lang.sortableHandle(labelOf(item))}
                              aria-describedby={instructionsId}
                              aria-pressed={dragging && active!.keyboard}
                              onKeydown={(event: KeyboardEvent) => onKeydown(event, item)}
                              onBlur={() => {
                                if (active?.key === key && active.keyboard) active = null;
                              }}
                            >
                              <Icon icon={GripVertical} />
                            </ButtonBase>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          </ScrollArea>
          {dragged && ghost && (
            <div
              aria-hidden="true"
              {...stylex.attrs(
                kanbanBoardStyles.card,
                kanbanBoardStyles.ghost,
                kanbanBoardDynamicStyles.ghost(ghost.left, ghost.top, ghost.width),
              )}
            >
              <div>{children(dragged, { dragging: true })}</div>
            </div>
          )}
          <VisuallyHidden id={instructionsId}>{messages.kanbanInstructions}</VisuallyHidden>
          <VisuallyHidden aria-live="assertive">{announcement}</VisuallyHidden>
        </div>
      );
    };
  },
);
