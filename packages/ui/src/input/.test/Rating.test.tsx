// Rating：单选组里每颗星一个 radio（名称“3 星”）；点选、再点清空、半星；只读时是一个 role="img"
import { describe, expect, it } from 'vitest';
import { nextTick, reactive } from 'vue';
import { Field } from '../../form/Field';
import { mount } from '../../utils/.test/mount';
import { Rating } from '../Rating';

describe('Rating', () => {
  it('radiogroup 以 Field 的标签为名称；每颗星一个 radio，名称是“n 星”', () => {
    const root = mount(() => (
      <Field label="交付质量">
        <Rating />
      </Field>
    ));
    const group = root.querySelector('[role="radiogroup"]')!;
    const label = root.querySelector('label')!;
    expect(group.getAttribute('aria-labelledby')).toBe(label.id);
    const radios = [...group.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
    expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual([
      '1 星',
      '2 星',
      '3 星',
      '4 星',
      '5 星',
    ]);
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
  });

  it('点选写回分数；再点同一个清空；clearable={false} 时不清空', async () => {
    const state = reactive<{ score: number | null }>({ score: null });
    const root = mount(() => <Rating _value={state.score} aria-label="评分" />);
    const radio = (label: string) =>
      root.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
    radio('4 星').click();
    await nextTick();
    expect(state.score).toBe(4);
    expect(root.querySelectorAll('[data-state="full"]')).toHaveLength(4);
    radio('4 星').click();
    await nextTick();
    expect(state.score).toBeNull();

    const kept = reactive<{ score: number | null }>({ score: 2 });
    const fixed = mount(() => <Rating _value={kept.score} clearable={false} aria-label="不清空" />);
    fixed.querySelector<HTMLInputElement>('input[aria-label="2 星"]')!.click();
    await nextTick();
    expect(kept.score).toBe(2);
  });

  it('半星：每颗星两个 radio；3.5 星时第四颗是半颗', () => {
    const root = mount(() => <Rating _value={3.5} allowHalf aria-label="评分" />);
    expect(root.querySelectorAll('input')).toHaveLength(10);
    expect(root.querySelector<HTMLInputElement>('input[aria-label="3.5 星"]')!.checked).toBe(true);
    const states = [...root.querySelectorAll('[data-state]')].map((star) =>
      star.getAttribute('data-state'),
    );
    expect(states).toEqual(['full', 'full', 'full', 'half', 'empty']);
  });

  it('只读：一个 role="img"，读“4.5 星，满分 5 星”；没有 radio', () => {
    const root = mount(() => <Rating _value={4.5} readonly />);
    const image = root.querySelector('[role="img"]')!;
    expect(image.getAttribute('aria-label')).toBe('4.5 星，满分 5 星');
    expect(root.querySelector('input')).toBeNull();
    const empty = mount(() => <Rating readonly />);
    expect(empty.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('未评分');
  });
});
