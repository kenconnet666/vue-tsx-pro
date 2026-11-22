// TrackTimeline 在真实浏览器里：拖时间尺定位播放头（吸附到帧），拖关键帧改时刻（松开记一次），键盘挪播放头
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { TrackTimeline, type TrackTimelineItem } from '@zerodep-dev/vue-tsx-pro-ui';
import { expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';

function setup() {
  let time = _state(0);
  let keys = _state<TrackTimelineItem[]>([{ kind: 'key', id: 'k', time: 1 }]);
  const ends: number[] = [];
  const root = mount(
    _component(() => () => (
      <div style={{ width: '600px' }}>
        <TrackTimeline
          tracks={[{ id: 'pos', label: '位置', items: keys }]}
          duration={10}
          frameRate={10}
          labelWidth="100px"
          _time={time}
          onItemMove={(_track: string, _item: string, at: number, { phase }: { phase: string }) => {
            keys = [{ kind: 'key', id: 'k', time: at }];
            if (phase === 'end') ends.push(at);
          }}
          aria-label="时间轴"
        />
      </div>
    )),
  );
  const lanes = root.querySelector<HTMLElement>('[data-part="lanes"]')!;
  const box = lanes.getBoundingClientRect();
  /** 轨道区里第 seconds 秒的横坐标 */
  const xAt = (seconds: number) => box.left + (seconds / 10) * box.width;
  const pointer = (target: Element, type: string, x: number) =>
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 1,
        pointerId: 1,
        clientX: x,
        clientY: box.top + 10,
      }),
    );
  return { root, lanes, xAt, pointer, time: () => time, ends, keys: () => keys };
}

it('拖时间尺定位播放头，吸附到帧', async () => {
  await page.viewport(900, 600);
  const { lanes, xAt, pointer, time } = setup();
  pointer(lanes, 'pointerdown', xAt(3.04));
  pointer(lanes, 'pointermove', xAt(5.33));
  pointer(lanes, 'pointerup', xAt(5.33));
  expect(time()).toBeCloseTo(5.3);
});

it('拖关键帧改时刻：拖动中跟着，松开记一次；拖关键帧不动播放头', async () => {
  await page.viewport(900, 600);
  const { root, xAt, pointer, ends, keys, time } = setup();
  const key = root.querySelector('[data-part="key"]')!;
  pointer(key, 'pointerdown', xAt(1));
  pointer(key, 'pointermove', xAt(2));
  pointer(key, 'pointermove', xAt(4.02));
  pointer(key, 'pointerup', xAt(4.02));
  await expect.poll(() => ends).toEqual([4]);
  expect((keys()[0] as { time: number }).time).toBe(4);
  expect(time()).toBe(0);
});

it('键盘：聚焦以后 → 一帧，Shift + → 一秒，End 到结尾', async () => {
  await page.viewport(900, 600);
  const { root, time } = setup();
  root.querySelector<HTMLElement>('[role="group"]')!.focus();
  await userEvent.keyboard('{ArrowRight}{Shift>}{ArrowRight}{/Shift}');
  expect(time()).toBeCloseTo(1.1);
  await userEvent.keyboard('{End}');
  expect(time()).toBe(10);
});
