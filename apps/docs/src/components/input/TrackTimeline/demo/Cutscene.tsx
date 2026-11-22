// 一段 8 秒的过场：方块的位置有三个关键帧（拖着改时刻，按帧吸附），镜头轨道是切换点，字幕轨道是几段字。
// 播放按钮让播放头走起来；拖时间尺或空白处定位，← → 一帧、Shift 一秒；选中关键帧时 Alt + ← → 挪它
import { Pause, Play } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Card,
  Flex,
  IconButton,
  Small,
  Toolbar,
  TrackTimeline,
  type TrackTimelineItem,
  type TrackTimelineSelection,
  type TrackTimelineTrack,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { onUnmounted } from 'vue';

const DURATION = 8;

export default _component(() => {
  let time = _state(0);
  let playing = _state(false);
  let selected = _state<TrackTimelineSelection | null>(null);
  let keys = _state<TrackTimelineItem[]>([
    { kind: 'key', id: 'k0', time: 0 },
    { kind: 'key', id: 'k1', time: 3 },
    { kind: 'key', id: 'k2', time: 6.5 },
  ]);
  let frame = 0;
  onUnmounted(() => cancelAnimationFrame(frame));

  const tracks = (): TrackTimelineTrack[] => [
    { id: 'position', label: '方块 · 位置', items: keys },
    {
      id: 'camera',
      label: '镜头',
      items: [
        { kind: 'marker', id: 'wide', time: 0, label: '全景' },
        { kind: 'marker', id: 'close', time: 4, label: '近景' },
      ],
    },
    {
      id: 'subtitle',
      label: '字幕',
      items: [
        { kind: 'clip', id: 's1', start: 0.5, end: 3, label: '天快黑了' },
        { kind: 'clip', id: 's2', start: 4.5, end: 7.5, label: '回营地吧' },
      ],
    },
  ];

  const toggle = () => {
    playing = !playing;
    if (!playing) return cancelAnimationFrame(frame);
    if (time >= DURATION) time = 0;
    let last = performance.now();
    const step = (now: number) => {
      if (!playing) return;
      time = Math.min(DURATION, time + (now - last) / 1000);
      last = now;
      if (time >= DURATION) playing = false;
      else frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  };

  const status = () =>
    selected?.item
      ? `选中 ${selected.track} · ${selected.item}`
      : selected
        ? `选中轨道 ${selected.track}`
        : '没有选中';

  return () => (
    <Card padding="none" variant="outline">
      <Toolbar docked="top" aria-label="过场">
        <IconButton
          size="sm"
          variant="ghost"
          icon={playing ? Pause : Play}
          aria-label={playing ? '暂停' : '播放'}
          onClick={toggle}
        />
        <Small tone="muted" numeric>
          {time.toFixed(2)} / {DURATION.toFixed(2)} s
        </Small>
        <Flex grow />
        <Small tone="muted">{status()}</Small>
      </Toolbar>
      <TrackTimeline
        tracks={tracks()}
        duration={DURATION}
        frameRate={24}
        _time={time}
        _selected={selected}
        onItemMove={(_track, item, at) => {
          keys = keys.map((key) =>
            key.id === item && key.kind === 'key' ? { ...key, time: at } : key,
          );
        }}
        aria-label="过场的轨道"
      />
    </Card>
  );
});
