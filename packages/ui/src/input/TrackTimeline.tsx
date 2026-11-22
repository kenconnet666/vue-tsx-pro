/**
 * 轨道时间轴（剪辑、动画、过场编辑的那种）：左边一列轨道名，右边上面是时间尺、下面每条轨道一行——关键帧（菱形）、片段（条）、
 * 标记（竖线加名字），一根播放头竖穿所有轨道。拖时间尺或空白处移播放头，拖关键帧改它的时刻，都按帧吸附。
 *
 *   <TrackTimeline duration={10} frameRate={30} tracks={tracks} _time={time} _selected={selected}
 *     onItemMove={(track, item, time, { phase }) => moveKey(track, item, time, phase === 'end')} aria-label="过场" />
 *
 * - 轨道：{ id, label, items }；项是 key（time）、clip（start、end，没有 end 时按名字的宽度）、marker（time）。
 * - 选中：点轨道名选中轨道，点项选中项（_selected 是 { track, item? }）；拖动只对 movable 的关键帧（默认能拖）。
 * - detail 给了时整个轨道区换成它（选中轨道的曲线编辑器），时间尺和播放头照旧。
 * - 键盘（时间轴能聚焦）：← → 一帧（Shift 一秒），Home / End 到头尾；选中关键帧时 Alt + ← → 挪它一帧。
 *
 * 部件（data-scope="track-timeline"）：Root（div）、Labels（轨道名一列）、Label（一条轨道的名字）、Lanes（右边）、Ruler（时间尺）、
 * Tick（刻度）、Lane（一条轨道）、Key、Clip、Marker、Playhead、Detail。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { partAttrs } from '../config/styles';
import { t } from '../config/theme/tokens';
import { mergeAttrs, type PartProps } from '../utils/props';
import { startMove } from '../utils/dom/move';
import { focusRingStyles } from '../utils/style/styles';

/** 轨道上的一项 */
export type TrackTimelineItem =
  | {
      /** 关键帧：一个时刻，画成菱形 */
      kind: 'key';
      /** 标识（同一条轨道里不重复） */
      id: string;
      /** 时刻（秒） */
      time: number;
      /** 悬停提示 */
      label?: string;
      /** 能拖着改时刻，默认 true */
      movable?: boolean;
    }
  | {
      /** 片段：一段时间，画成条（字幕、声音、动画剪辑） */
      kind: 'clip';
      /** 标识 */
      id: string;
      /** 开始（秒） */
      start: number;
      /** 结束（秒）；不写时条按名字的宽度 */
      end?: number;
      /** 条上的名字 */
      label?: string;
    }
  | {
      /** 标记：一个时刻的竖线加名字（镜头切换、事件） */
      kind: 'marker';
      /** 标识 */
      id: string;
      /** 时刻（秒） */
      time: number;
      /** 竖线旁的名字 */
      label?: string;
    };

/** 一条轨道 */
export interface TrackTimelineTrack {
  /** 标识（_selected 写它） */
  id: string;
  /** 轨道名 */
  label: string;
  /** 轨道上的项 */
  items: readonly TrackTimelineItem[];
}

/** 选中的轨道和项 */
export interface TrackTimelineSelection {
  /** 轨道的 id */
  readonly track: string;
  /** 项的 id；只选了轨道时没有 */
  readonly item?: string;
}

/** 角色、焦点由组件管理 */
export type TrackTimelineManaged = 'role' | 'tabindex';

/** 未声明的属性落到外层 div 上；aria-label 是时间轴的名称 */
export interface TrackTimelineProps extends PartProps<'div', TrackTimelineManaged> {
  /** 轨道 */
  tracks: readonly TrackTimelineTrack[];
  /** 总长（秒） */
  duration: number;
  /** 每秒几帧：拖动、键盘按帧吸附，默认 30 */
  frameRate?: number;
  /** 播放头（秒）：父级写 _time={x} */
  _time?: number;
  /** 选中的轨道和项：父级写 _selected={x}；没有时是 null */
  _selected?: TrackTimelineSelection | null;
  /** 拖了一个关键帧（或 Alt + 方向键）：新的时刻；拖动中 phase 是 move，松开是 end */
  onItemMove?: (
    track: string,
    item: string,
    time: number,
    change: { phase: 'move' | 'end' },
  ) => void;
  /** 轨道名那一列的宽（CSS 长度），默认 `'14em'` */
  labelWidth?: string;
  /** 换掉轨道区的内容（选中轨道的曲线编辑器）：时间尺、播放头照旧 */
  detail?: VNodeChild;
  /** 轨道名的部件属性 */
  propsLabel?: PartProps<'div'>;
  /** 轨道区一行的部件属性 */
  propsLane?: PartProps<'div'>;
  /** 播放头的部件属性 */
  propsPlayhead?: PartProps<'span'>;
}

/** 部件的标记（data-scope="track-timeline"） */
const timelinePart = (part: string) => partAttrs({ name: 'TrackTimeline' }, part);

/** TrackTimeline 的样式 */
const trackTimelineStyles = css.create({
  root: { display: 'grid', minWidth: 0, fontSize: '_sm', outlineStyle: 'none' },
  labels: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  cell: {
    boxSizing: 'border-box',
    height: '1.75em',
    display: 'flex',
    alignItems: 'center',
    borderBlockEndWidth: '_xs',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_borderMuted',
  },
  label: {
    paddingInline: '_sm',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    backgroundColor: { default: 'transparent', _hover: '_fillHover' },
  },
  selectedLabel: { backgroundColor: '_accentSoft', color: '_accentText' },
  lanes: {
    position: 'relative',
    minWidth: 0,
    cursor: 'text',
    userSelect: 'none',
    touchAction: 'none',
  },
  ruler: { position: 'relative', color: '_textMuted' },
  tick: {
    position: 'absolute',
    insetBlock: 0,
    display: 'flex',
    alignItems: 'center',
    paddingInlineStart: '_xxs',
    fontSize: '_xs',
    borderInlineStartWidth: '_xs',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: '_border',
  },
  lane: { position: 'relative' },
  key: {
    position: 'absolute',
    insetBlockStart: '50%',
    width: '0.7em',
    height: '0.7em',
    translate: '-50% -50%',
    rotate: '45deg',
    backgroundColor: '_text',
    cursor: 'ew-resize',
  },
  fixedKey: { cursor: 'pointer' },
  selectedKey: {
    backgroundColor: '_accent',
    boxShadow: `0 0 0 ${t.borderWidths.sm} ${t.colors.accentSoft}`,
  },
  clip: {
    position: 'absolute',
    insetBlock: '0.2em',
    display: 'flex',
    alignItems: 'center',
    paddingInline: '_xs',
    borderRadius: '_sm',
    backgroundColor: '_accentSoft',
    fontSize: '_xs',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  selectedItem: { outlineWidth: '_xs', outlineStyle: 'solid', outlineColor: '_accent' },
  marker: {
    position: 'absolute',
    insetBlock: '0.15em',
    display: 'flex',
    alignItems: 'center',
    paddingInlineStart: '_xs',
    borderInlineStartWidth: '_sm',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: '_accent',
    fontSize: '_xs',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  playhead: {
    position: 'absolute',
    insetBlock: 0,
    width: '_borderWidths.xs',
    backgroundColor: '_danger',
    pointerEvents: 'none',
  },
  detail: { position: 'relative' },
});

// 位置、宽度随时刻变：动态样式单独一个 create，见 COMPONENTS.md §4
/** TrackTimeline 的样式：columns、at、span */
const trackTimelinePositionStyles = css.create({
  columns: (labelWidth: string) => ({ gridTemplateColumns: `${labelWidth} minmax(0, 1fr)` }),
  at: (percent: number) => ({ insetInlineStart: `${percent}%` }),
  span: (percent: number) => ({ width: `${percent}%` }),
});

/** 时间尺的刻度间隔（秒）：总长越长越稀 */
const tickStep = (duration: number) =>
  duration <= 10 ? 1 : duration <= 60 ? 5 : duration <= 300 ? 30 : 60;

/** 轨道时间轴：轨道名、时间尺、关键帧、片段、标记、播放头 */
export const TrackTimeline = _component(
  ({
    tracks,
    duration,
    frameRate = 30,
    _time: time = _bindable(0),
    _selected: selected = _bindable<TrackTimelineSelection | null>(null),
    onItemMove,
    labelWidth = '14em',
    detail,
    propsLabel,
    propsLane,
    propsPlayhead,
    ...rest
  }: TrackTimelineProps) => {
    let lanes = _state.raw<HTMLElement | null>(null);
    let root = _state.raw<HTMLElement | null>(null);
    const percent = (seconds: number) => (duration > 0 ? (seconds / duration) * 100 : 0);
    const snap = (seconds: number) =>
      Math.min(Math.max(Math.round(seconds * frameRate) / frameRate, 0), duration);
    /** 屏幕上的横坐标换成时刻（吸附到帧；从右往左排版时反过来） */
    const timeAt = (clientX: number) => {
      const box = lanes!.getBoundingClientRect();
      const rtl = getComputedStyle(lanes!).direction === 'rtl';
      const fraction = (rtl ? box.right - clientX : clientX - box.left) / box.width;
      return snap(fraction * duration);
    };

    /** 按住时间尺或空白处：播放头跟着指针 */
    const seek = (event: PointerEvent) => {
      if (event.button !== 0) return;
      root?.focus({ preventScroll: true });
      time = timeAt(event.clientX);
      startMove(event, { onMove: (_, moved) => (time = timeAt(moved.clientX)) });
    };

    /** 按住一个关键帧：选中它，能拖时之后的移动改它的时刻 */
    const grabKey = (
      event: PointerEvent,
      track: string,
      item: Extract<TrackTimelineItem, { kind: 'key' }>,
    ) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      root?.focus({ preventScroll: true });
      selected = { track, item: item.id };
      if (item.movable === false || !onItemMove) return;
      let last = item.time;
      startMove(event, {
        threshold: 2,
        onMove: (_, moved) => {
          const next = timeAt(moved.clientX);
          if (next === last) return;
          last = next;
          onItemMove(track, item.id, next, { phase: 'move' });
        },
        onEnd: ({ moved }) => {
          if (moved) onItemMove(track, item.id, last, { phase: 'end' });
        },
      });
    };

    const select = (event: PointerEvent, track: string, item?: string) => {
      event.stopPropagation();
      selected = item === undefined ? { track } : { track, item };
    };

    /** ← → 一帧（Shift 一秒），Home / End；选中关键帧时 Alt + ← → 挪它 */
    const onKeydown = (event: KeyboardEvent) => {
      const direction =
        getComputedStyle(event.currentTarget as Element).direction === 'rtl' ? -1 : 1;
      const arrow =
        event.key === 'ArrowRight' ? direction : event.key === 'ArrowLeft' ? -direction : 0;
      if (arrow !== 0 && event.altKey) {
        const track = tracks.find((item) => item.id === selected?.track);
        const key = track?.items.find((item) => item.id === selected?.item);
        if (track && key?.kind === 'key' && key.movable !== false && onItemMove) {
          event.preventDefault();
          onItemMove(track.id, key.id, snap(key.time + arrow / frameRate), { phase: 'end' });
        }
        return;
      }
      const next =
        arrow !== 0
          ? time + arrow * (event.shiftKey ? 1 : 1 / frameRate)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? duration
              : undefined;
      if (next === undefined) return;
      event.preventDefault();
      time = snap(next);
    };

    const item = (track: TrackTimelineTrack, entry: TrackTimelineItem) => {
      const active = selected?.track === track.id && selected.item === entry.id;
      const state = active ? 'selected' : undefined;
      switch (entry.kind) {
        case 'key':
          return (
            <span
              key={entry.id}
              {...css.attrs(
                trackTimelineStyles.key,
                entry.movable === false && trackTimelineStyles.fixedKey,
                active && trackTimelineStyles.selectedKey,
                trackTimelinePositionStyles.at(percent(entry.time)),
              )}
              {...timelinePart('key')}
              data-state={state}
              title={entry.label ?? `${entry.time.toFixed(2)} s`}
              onPointerdown={(event: PointerEvent) => grabKey(event, track.id, entry)}
            />
          );
        case 'clip':
          return (
            <span
              key={entry.id}
              {...css.attrs(
                trackTimelineStyles.clip,
                active && trackTimelineStyles.selectedItem,
                trackTimelinePositionStyles.at(percent(entry.start)),
                entry.end !== undefined &&
                  trackTimelinePositionStyles.span(percent(entry.end - entry.start)),
              )}
              {...timelinePart('clip')}
              data-state={state}
              title={entry.label}
              onPointerdown={(event: PointerEvent) => select(event, track.id, entry.id)}
            >
              {entry.label}
            </span>
          );
        case 'marker':
          return (
            <span
              key={entry.id}
              {...css.attrs(
                trackTimelineStyles.marker,
                active && trackTimelineStyles.selectedItem,
                trackTimelinePositionStyles.at(percent(entry.time)),
              )}
              {...timelinePart('marker')}
              data-state={state}
              title={entry.label}
              onPointerdown={(event: PointerEvent) => select(event, track.id, entry.id)}
            >
              {entry.label}
            </span>
          );
      }
    };

    return () => {
      const step = tickStep(duration);
      const ticks = Array.from({ length: Math.floor(duration / step) + 1 }, (_, i) => i * step);
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                trackTimelineStyles.root,
                focusRingStyles.inset,
                trackTimelinePositionStyles.columns(labelWidth),
              ],
              ...timelinePart('root'),
            },
            rest,
            { ref: _toRef(root), role: 'group', tabindex: 0, onKeydown },
          )}
          data-time={time}
        >
          <div {...css.attrs(trackTimelineStyles.labels)} {...timelinePart('labels')}>
            <div {...css.attrs(trackTimelineStyles.cell)} aria-hidden="true" />
            {tracks.map((track) => (
              <div
                key={track.id}
                {...mergeAttrs<'div'>(
                  {
                    sx: [
                      trackTimelineStyles.cell,
                      trackTimelineStyles.label,
                      selected?.track === track.id && trackTimelineStyles.selectedLabel,
                    ],
                    ...timelinePart('label'),
                  },
                  propsLabel,
                  { onClick: () => (selected = { track: track.id }) },
                )}
                data-state={selected?.track === track.id ? 'selected' : undefined}
                title={track.label}
              >
                {track.label}
              </div>
            ))}
          </div>
          <div
            {...css.attrs(trackTimelineStyles.lanes)}
            {...timelinePart('lanes')}
            ref={_toRef(lanes)}
            onPointerdown={seek}
          >
            <div
              {...css.attrs(trackTimelineStyles.cell, trackTimelineStyles.ruler)}
              {...timelinePart('ruler')}
            >
              {ticks.map((tick) => (
                <span
                  key={tick}
                  {...css.attrs(
                    trackTimelineStyles.tick,
                    trackTimelinePositionStyles.at(percent(tick)),
                  )}
                  {...timelinePart('tick')}
                >
                  {tick}s
                </span>
              ))}
            </div>
            {detail != null && detail !== false ? (
              <div {...css.attrs(trackTimelineStyles.detail)} {...timelinePart('detail')}>
                {detail}
              </div>
            ) : (
              tracks.map((track) => (
                <div
                  key={track.id}
                  {...mergeAttrs<'div'>(
                    {
                      sx: [trackTimelineStyles.cell, trackTimelineStyles.lane],
                      ...timelinePart('lane'),
                    },
                    propsLane,
                  )}
                >
                  {track.items.map((entry) => item(track, entry))}
                </div>
              ))
            )}
            <span
              {...mergeAttrs<'span'>(
                {
                  sx: [trackTimelineStyles.playhead, trackTimelinePositionStyles.at(percent(time))],
                  ...timelinePart('playhead'),
                },
                propsPlayhead,
              )}
              aria-hidden="true"
            />
          </div>
        </div>
      );
    };
  },
);
