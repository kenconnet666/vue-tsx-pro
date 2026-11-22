// TrackTimeline：轨道和各种项、点选、键盘移播放头和关键帧、detail 换掉轨道区
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import {
  TrackTimeline,
  type TrackTimelineSelection,
  type TrackTimelineTrack,
} from '../TrackTimeline';

const tracks: TrackTimelineTrack[] = [
  {
    id: 'pos',
    label: '方块 · 位置',
    items: [
      { kind: 'key', id: 'k0', time: 0 },
      { kind: 'key', id: 'k1', time: 2, label: '2 秒' },
    ],
  },
  { id: 'cam', label: '镜头', items: [{ kind: 'marker', id: 'c0', time: 1, label: '近景' }] },
  {
    id: 'sub',
    label: '字幕',
    items: [{ kind: 'clip', id: 's0', start: 1, end: 3, label: '你好' }],
  },
];

function setup(props: Record<string, unknown> = {}) {
  let time = _state(1);
  let selected = _state<TrackTimelineSelection | null>(null);
  const moves: [string, string, number, string][] = [];
  const root = mount(() => (
    <TrackTimeline
      tracks={tracks}
      duration={4}
      frameRate={10}
      _time={time}
      _selected={selected}
      onItemMove={(track: string, item: string, at: number, { phase }: { phase: string }) =>
        moves.push([track, item, at, phase])
      }
      aria-label="过场"
      {...props}
    />
  ));
  const group = root.querySelector<HTMLElement>('[role="group"]')!;
  const key = async (name: string, options: KeyboardEventInit = {}) => {
    group.dispatchEvent(
      new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...options }),
    );
    await nextTick();
  };
  return { root, key, moves, time: () => time, selected: () => selected };
}

describe('TrackTimeline', () => {
  it('轨道名一列，各轨道画出关键帧、标记、片段；刻度按总长', () => {
    const { root } = setup();
    expect([...root.querySelectorAll('[data-part="label"]')].map((el) => el.textContent)).toEqual([
      '方块 · 位置',
      '镜头',
      '字幕',
    ]);
    expect(root.querySelectorAll('[data-part="key"]')).toHaveLength(2);
    expect(root.querySelector('[data-part="marker"]')!.textContent).toBe('近景');
    expect(root.querySelector('[data-part="clip"]')!.textContent).toBe('你好');
    expect([...root.querySelectorAll('[data-part="tick"]')].map((el) => el.textContent)).toEqual([
      '0s',
      '1s',
      '2s',
      '3s',
      '4s',
    ]);
  });

  it('点轨道名选中轨道，按下项选中项', async () => {
    const { root, selected } = setup();
    (root.querySelectorAll('[data-part="label"]')[1] as HTMLElement).click();
    expect(selected()).toEqual({ track: 'cam' });
    root
      .querySelector('[data-part="clip"]')!
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    await nextTick();
    expect(selected()).toEqual({ track: 'sub', item: 's0' });
    expect(root.querySelector('[data-part="clip"]')!.getAttribute('data-state')).toBe('selected');
  });

  it('键盘：← → 一帧、Shift 一秒、Home / End；选中关键帧时 Alt + → 挪它一帧（end）', async () => {
    const { root, key, time, moves } = setup();
    await key('ArrowRight');
    expect(time()).toBeCloseTo(1.1);
    await key('ArrowLeft', { shiftKey: true });
    expect(time()).toBeCloseTo(0.1);
    await key('End');
    expect(time()).toBe(4);
    await key('Home');
    expect(time()).toBe(0);
    root
      .querySelectorAll('[data-part="key"]')[1]!
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    await nextTick();
    await key('ArrowRight', { altKey: true });
    expect(moves).toEqual([['pos', 'k1', 2.1, 'end']]);
  });

  it('不能拖的关键帧 Alt + 方向键不动；detail 换掉轨道区，时间尺和播放头还在', async () => {
    const fixed: TrackTimelineTrack[] = [
      { id: 'pos', label: '位置', items: [{ kind: 'key', id: 'k', time: 1, movable: false }] },
    ];
    const { root, key, moves } = setup({ tracks: fixed, _selected: { track: 'pos', item: 'k' } });
    await key('ArrowRight', { altKey: true });
    expect(moves).toEqual([]);
    const detailed = setup({ detail: <p>曲线</p> });
    expect(detailed.root.querySelector('[data-part="lane"]')).toBeNull();
    expect(detailed.root.querySelector('[data-part="detail"]')!.textContent).toBe('曲线');
    expect(detailed.root.querySelector('[data-part="ruler"]')).not.toBeNull();
    expect(detailed.root.querySelector('[data-part="playhead"]')).not.toBeNull();
    void root;
  });
});
