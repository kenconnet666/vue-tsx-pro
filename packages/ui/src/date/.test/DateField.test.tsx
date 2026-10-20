// DateField、TimeField：段的顺序与读屏属性、逐段输入与自动跳段（焦点跟过去）、填全才写回、超出范围显示出错、清空、表单值、中英文
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { Provider } from '../../config/Provider';
import { enUS } from '../../config/lang/en-US';
import { Field } from '../../form/Field';
import { mount } from '../../utils/.test/mount';
import { DateField } from '../DateField';
import { TimeField } from '../TimeField';

const segments = (root: HTMLElement) => [
  ...root.querySelectorAll<HTMLElement>('[role="spinbutton"]'),
];
const segment = (root: HTMLElement, type: string) =>
  root.querySelector<HTMLElement>(`[data-type="${type}"]`)!;
const text = (root: HTMLElement) => root.querySelector('[role="group"]')!.textContent;

/** 在焦点段输入（beforeinput，同真实浏览器与软键盘） */
async function type(chars: string) {
  for (const char of chars) {
    document.activeElement!.dispatchEvent(
      new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: char,
        bubbles: true,
        cancelable: true,
      }),
    );
    await nextTick();
    await nextTick();
  }
}
async function press(key: string) {
  document.activeElement!.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  );
  await nextTick();
  await nextTick();
}

describe('DateField', () => {
  it('zh-CN 年/月/日：每段 role="spinbutton"，名称是“字段名 + 段名”，没填的段念“未填写”', () => {
    const root = mount(() => (
      <Field label="生日">
        <DateField />
      </Field>
    ));
    const [year, month] = segments(root);
    expect(segments(root).map((item) => item.dataset.type)).toEqual(['year', 'month', 'day']);
    expect(text(root)).toBe('年/月/日');
    const label = root.querySelector('label')!;
    expect(year!.getAttribute('aria-labelledby')).toBe(`${label.id} ${year!.id}`);
    expect(year!.getAttribute('aria-label')).toBe('年');
    expect(month!.getAttribute('aria-valuetext')).toBe('未填写');
    expect([month!.getAttribute('aria-valuemin'), month!.getAttribute('aria-valuemax')]).toEqual([
      '1',
      '12',
    ]);
    expect(month!.getAttribute('inputmode')).toBe('numeric');
    expect(month!.getAttribute('contenteditable')).toBe('true');
  });

  it('逐段输入：满了自动跳段、焦点跟过去；填全才写回 ISO', async () => {
    let value = _state<string | null>(null);
    const root = mount(() => <DateField value={_bind(value)} aria-label="日期" />);
    segment(root, 'year').focus();
    await type('2026');
    expect(document.activeElement).toBe(segment(root, 'month'));
    await type('3');
    expect(document.activeElement).toBe(segment(root, 'day'));
    expect(value).toBeNull();
    await type('15');
    expect(value).toBe('2026-03-15');
    expect(text(root)).toBe('2026/03/15');
  });

  it('↑↓ 加减并回绕；Backspace 删空后写回 null', async () => {
    let value = _state<string | null>('2026-12-31');
    const root = mount(() => <DateField value={_bind(value)} aria-label="日期" />);
    segment(root, 'month').focus();
    await press('ArrowUp');
    expect(value).toBe('2026-01-31');
    segment(root, 'day').focus();
    await press('Backspace');
    await press('Backspace');
    expect(value).toBeNull();
    expect(segment(root, 'day').getAttribute('aria-valuetext')).toBe('未填写');
  });

  it('外部改值时各段跟着变', async () => {
    let value = _state<string | null>('2026-10-20');
    const root = mount(() => <DateField value={_bind(value)} aria-label="日期" />);
    value = '2027-01-02';
    await nextTick();
    expect(text(root)).toBe('2027/01/02');
    value = null;
    await nextTick();
    expect(text(root)).toBe('年/月/日');
  });

  it('超出 min / max、不可选的日期：外壳显示出错，各段 aria-invalid', () => {
    const root = mount(() => (
      <DateField
        value="2026-10-20"
        max="2026-10-01"
        aria-label="日期"
        propsRoot={{ class: 'shell' }}
      />
    ));
    expect(root.querySelector('.shell')!.hasAttribute('data-invalid')).toBe(true);
    expect(segment(root, 'day').getAttribute('aria-invalid')).toBe('true');
  });

  it('min / max 带时间时同一天里比时分；只给日期时那一整天都可选', () => {
    const shell = (props: { min?: string; max?: string }) =>
      mount(() => (
        <DateField
          value="2026-10-20T08:30"
          granularity="minute"
          aria-label="开始时间"
          propsRoot={{ class: 'shell' }}
          {...props}
        />
      )).querySelector('.shell')!;
    expect(shell({ min: '2026-10-20T09:00' }).hasAttribute('data-invalid')).toBe(true);
    expect(shell({ max: '2026-10-20T08:30:00' }).hasAttribute('data-invalid')).toBe(false);
    expect(shell({ max: '2026-10-20T08:00' }).hasAttribute('data-invalid')).toBe(true);
    expect(shell({ min: '2026-10-20', max: '2026-10-20' }).hasAttribute('data-invalid')).toBe(
      false,
    );
  });

  it('清空按钮、隐藏的表单值', async () => {
    let value = _state<string | null>('2026-10-20');
    const root = mount(() => (
      <DateField value={_bind(value)} clearable name="birthday" aria-label="生日" />
    ));
    expect(root.querySelector<HTMLInputElement>('input[type=hidden]')!.value).toBe('2026-10-20');
    root.querySelector<HTMLButtonElement>('button')!.click();
    await nextTick();
    expect(value).toBeNull();
    expect(root.querySelector('input[type=hidden]')).toBeNull();
  });

  it('en-US 月/日/年；granularity="month" 只有年月；"minute" 加上时分与上午下午', () => {
    const en = mount(() => (
      <Provider lang={enUS}>
        <DateField value="2026-10-20" aria-label="Date" />
        <DateField granularity="month" value="2026-10" aria-label="Month" />
        <DateField granularity="minute" value="2026-10-20T14:30" aria-label="At" />
      </Provider>
    ));
    const groups = [...en.querySelectorAll('[role="group"]')].map((group) => group.textContent);
    expect(groups).toEqual(['10/20/2026', '10/2026', '10/20/2026, 2:30 PM']);
  });

  it('zh-CN 的年月：结尾的“月”也是分隔符，要留着', () => {
    const root = mount(() => <DateField granularity="month" value="2026-10" aria-label="账期" />);
    expect(text(root)).toBe('2026年10月');
  });

  it('不可用：段不能聚焦、不可编辑', () => {
    const root = mount(() => <DateField disabled aria-label="日期" />);
    expect(
      segments(root).every((item) => item.tabIndex === -1 && !item.hasAttribute('contenteditable')),
    ).toBe(true);
  });
});

describe('TimeField', () => {
  it('zh-CN 24 小时制：打 1430 得到 14:30', async () => {
    let value = _state<string | null>(null);
    const root = mount(() => <TimeField value={_bind(value)} aria-label="时间" />);
    expect(text(root)).toBe('时:分');
    segment(root, 'hour').focus();
    await type('1430');
    expect(value).toBe('14:30');
  });

  it('en-US 12 小时制：打 a / p 切换上午下午，值仍是 24 小时制', async () => {
    let value = _state<string | null>('09:15');
    const root = mount(() => (
      <Provider lang={enUS}>
        <TimeField value={_bind(value)} aria-label="Time" />
      </Provider>
    ));
    expect(text(root)).toBe('9:15 AM');
    segment(root, 'dayPeriod').focus();
    await type('p');
    expect(value).toBe('21:15');
  });

  it('秒、min / max', () => {
    const root = mount(() => (
      <TimeField
        granularity="second"
        value="18:30:05"
        max="18:00"
        aria-label="时间"
        propsRoot={{ class: 'shell' }}
      />
    ));
    expect(text(root)).toBe('18:30:05');
    expect(root.querySelector('.shell')!.hasAttribute('data-invalid')).toBe(true);
  });
});
