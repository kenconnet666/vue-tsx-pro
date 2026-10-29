// SwipeCell：横滑过三成打开、不够弹回、竖滑不接管；打开时点击收起；小程序端横滑期间换成 catch
import { mountPage } from '@zerodep-dev/vue-tsx-pro-mini/testing';
import { describe, expect, it } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '../../utils/.test/mount';
import { FixedMeasure, swipe, touch } from '../../utils/.test/touch';
import { SwipeCell } from '../SwipeCell';

const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve));
  await nextTick();
};

describe('SwipeCell（H5）', () => {
  it('左滑超过右边宽度的三成打开；点击收起', async () => {
    const side = ref<'left' | 'right' | false>(false);
    const root = mount(() => (
      <FixedMeasure rect={{ width: 80 }}>
        <SwipeCell
          _open={side.value}
          onOpenChange={(next) => (side.value = next)}
          right={<span>删除</span>}
        >
          内容
        </SwipeCell>
      </FixedMeasure>
    ));
    await flush();
    const cell = root.firstElementChild!;
    const track = cell.firstElementChild as HTMLElement;

    swipe(cell, [200, 10], [180, 10]);
    await flush();
    expect(side.value).toBe(false);
    expect(track.style.transform).toBe('translateX(0px)');

    swipe(cell, [200, 10], [150, 12]);
    await flush();
    expect(side.value).toBe('right');
    expect(track.style.transform).toBe('translateX(-80px)');
    expect(cell.getAttribute('data-open')).toBe('right');

    (cell as HTMLElement).click();
    await flush();
    expect(side.value).toBe(false);
  });

  it('竖滑不接管：偏移不变，也不取消触摸', async () => {
    const root = mount(() => (
      <FixedMeasure rect={{ width: 80 }}>
        <SwipeCell right={<span>删除</span>}>内容</SwipeCell>
      </FixedMeasure>
    ));
    await flush();
    const cell = root.firstElementChild!;
    touch(cell, 'touchstart', 200, 10);
    touch(cell, 'touchmove', 195, 60);
    touch(cell, 'touchmove', 150, 80);
    await nextTick();
    expect((cell.firstElementChild as HTMLElement).style.transform).toBe('translateX(0px)');
  });
});

describe('SwipeCell（小程序）', () => {
  it('收 touchmove 的模板；横滑期间是 catch', async () => {
    const Demo = defineComponent(() => () => <SwipeCell right={<span>删除</span>}>内容</SwipeCell>);
    const page = mountPage(Demo);
    await page.settle();
    const cell = page.find((node) => node.t === 'touch')!;
    expect(cell.cm).toBeUndefined();
    await page.touch(cell, 'touchstart', 200, 10);
    await page.touch(cell, 'touchmove', 180, 11);
    expect(page.find((node) => node.t === 'touch')!.cm).toBe(1);
    await page.touch(cell, 'touchend', 180, 11);
    expect(page.find((node) => node.t === 'touch')!.cm).toBeFalsy();
  });
});
