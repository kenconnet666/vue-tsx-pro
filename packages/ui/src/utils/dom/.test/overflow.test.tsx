// useOverflowItems：放得下几项（留出“+N”的宽度）、藏起来的项不占位且读屏跳过、项数变了重新量；fitCount 的计算
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, shallowRef, type VNodeChild } from 'vue';
import { mount as mountNode } from '../../.test/mount';

const mount = (component: { setup: () => () => VNodeChild }) =>
  mountNode(() => h(defineComponent(component)));
import { fitCount, useOverflowItems } from '../overflow';

describe('fitCount', () => {
  it('都放得下时全部显示，不留“+N”', () => {
    expect(fitCount([30, 30, 30], 20, 4, 98)).toBe(3);
  });
  it('放不下时先留出“+N”，再尽量多放', () => {
    // 20(+N) + 4 + 30 + 4 + 30 = 88 ≤ 90，再放一项就超了
    expect(fitCount([30, 30, 30], 20, 4, 90)).toBe(2);
    expect(fitCount([30, 30, 30], 20, 4, 40)).toBe(0);
  });
});

// happy-dom 没有布局：按 data-width 给出宽度，容器宽度可调
let containerWidth = 0;
afterEach(() => vi.restoreAllMocks());
function stubLayout() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    return new DOMRect(0, 0, Number(this.dataset.width ?? 0), 20);
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.dataset.row === undefined ? 0 : containerWidth;
  });
}

const flush = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};

describe('useOverflowItems', () => {
  it('放不下的项藏起来（不占位、读屏跳过），“+N”写出折起的数目；项数变了重新量', async () => {
    stubLayout();
    containerWidth = 100;
    const tags = shallowRef(['设计', '前端', '后端']);
    const row = shallowRef<HTMLElement | null>(null);
    let state!: ReturnType<typeof useOverflowItems>;
    const root = mount({
      setup() {
        state = useOverflowItems({ container: () => row.value, count: () => tags.value.length });
        return () => (
          <div
            data-row=""
            ref={(element: unknown) => (row.value = element as HTMLElement)}
            style="display: flex"
          >
            {tags.value.map((tag, index) => (
              <span key={tag} data-width="40" {...state.itemProps(index)}>
                {tag}
              </span>
            ))}
            <span data-width="16" {...state.restProps()}>
              +{state.hidden}
            </span>
          </div>
        );
      },
    });
    await flush();
    // 16 + 40 + 40 = 96 ≤ 100：显示两项，第三项折起
    expect(state.visible).toBe(2);
    const spans = root.querySelectorAll('span');
    expect(spans[2]!.getAttribute('aria-hidden')).toBe('true');
    expect(spans[2]!.style.position).toBe('absolute');
    expect(spans[0]!.hasAttribute('aria-hidden')).toBe(false);
    expect(spans[3]!.textContent).toBe('+1');
    expect(spans[3]!.hasAttribute('aria-hidden')).toBe(false);

    tags.value = ['设计', '前端'];
    await flush();
    expect(state.visible).toBe(2);
    expect(state.hidden).toBe(0);
    // 没有折起的项时“+N”也藏起来
    expect(root.querySelectorAll('span')[2]!.getAttribute('aria-hidden')).toBe('true');
  });

  it('量不到布局时全部显示；min 保证至少显示几项', async () => {
    containerWidth = 0;
    stubLayout();
    let state!: ReturnType<typeof useOverflowItems>;
    const row = shallowRef<HTMLElement | null>(null);
    mount({
      setup() {
        state = useOverflowItems({ container: () => row.value, count: () => 3 });
        return () => (
          <div ref={(element: unknown) => (row.value = element as HTMLElement)}>
            {[0, 1, 2].map((index) => (
              <span key={index} {...state.itemProps(index)} />
            ))}
          </div>
        );
      },
    });
    await flush();
    expect(state.visible).toBe(3);

    containerWidth = 10;
    let narrow!: ReturnType<typeof useOverflowItems>;
    const narrowRow = shallowRef<HTMLElement | null>(null);
    mount({
      setup() {
        narrow = useOverflowItems({
          container: () => narrowRow.value,
          count: () => 3,
          min: () => 1,
        });
        return () => (
          <div data-row="" ref={(element: unknown) => (narrowRow.value = element as HTMLElement)}>
            {[0, 1, 2].map((index) => (
              <span key={index} data-width="40" {...narrow.itemProps(index)} />
            ))}
          </div>
        );
      },
    });
    await flush();
    expect(narrow.visible).toBe(1);
  });
});
