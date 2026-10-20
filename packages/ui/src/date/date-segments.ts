/**
 * 分段输入的状态（年、月、日、时、分、秒、上午 / 下午）：DateField、TimeField 共用。参考 React Aria 的 useDateFieldState。
 * 不碰 DOM：组件把每段渲染成 role="spinbutton" 的可聚焦元素，按键、输入交给这里，焦点该去哪一段由 focusedSegment 告诉组件。
 *
 * - 段的顺序、分隔符取自 Intl（zh-CN 年/月/日，en-US 月/日/年，de-DE 日.月.年），12 / 24 小时制按语言或配置；
 * - 逐段输入：打一个数字后，再打一个就超出范围时直接跳到下一段（月份打 3 → 03 跳走，打 1 → 等第二位）；
 * - ↑↓ 加减（到头时回绕），Page Up / Down 大步，Home / End 到最小 / 最大，Backspace 删一位、删空后回到上一段；
 * - 所有段都填了才写回值；填好的值删掉一段时写回 null。认全角数字与阿拉伯-印度数字。
 *
 *   const segments = useDateSegments({ fields: () => ['year', 'month', 'day'], value: () => fields, onChange, … });
 */
import { computed, ref, shallowRef, watch } from 'vue';
import type { HourCycles } from '../config/lang/lang';

/** 可以输入的段 */
export interface DateSegmentTypes {
  /** 年 */
  year: unknown;
  /** 月 */
  month: unknown;
  /** 日 */
  day: unknown;
  /** 时（内部总是 0–23，12 小时制时显示 1–12） */
  hour: unknown;
  /** 分 */
  minute: unknown;
  /** 秒 */
  second: unknown;
  /** 上午 / 下午（12 小时制时自动加上） */
  dayPeriod: unknown;
}

/** 一段的类型 */
export type DateSegmentType = keyof DateSegmentTypes;

/** 值的各个字段：时是 0–23 */
export type DateFieldValues = Partial<Record<Exclude<DateSegmentType, 'dayPeriod'>, number>>;

/** 渲染用的一段 */
export interface DateSegment {
  /** 段的类型；literal 是分隔符（/、:、年） */
  type: DateSegmentType | 'literal';
  /** 显示的文字：值、正在输入的数字，或占位文字 */
  text: string;
  /** 还没填：显示的是占位文字 */
  placeholder: boolean;
  /** 当前值（dayPeriod 是 0 上午 / 1 下午）；没填时 null */
  value: number | null;
  /** 最小值（aria-valuemin） */
  min: number;
  /** 最大值（aria-valuemax） */
  max: number;
  /** 段的名称（取自 Intl.DisplayNames：年、月、日 / year、month、day），给 aria-label */
  label: string;
}

/** useDateSegments 的选项 */
export interface DateSegmentsOptions {
  /** 有哪些段（不含 dayPeriod，12 小时制时自动加） */
  fields: () => readonly Exclude<DateSegmentType, 'dayPeriod'>[];
  /** 语言：段的顺序、分隔符、数字的写法 */
  locale: () => string;
  /** 12 / 24 小时制；不写时按语言 */
  hourCycle?: () => keyof HourCycles | undefined;
  /** 完整的值（外部传入）；没有时 null */
  value: () => DateFieldValues | null;
  /** 所有段都填了时写回完整的值，填好的值删掉一段时写回 null */
  onChange: (value: DateFieldValues | null) => void;
  /** ↑↓ 从空段开始加减时的起点（一般是现在） */
  placeholderValue: () => DateFieldValues;
  /** 各段的占位文字（年、月、日 / yyyy、mm、dd） */
  placeholders: () => Partial<Record<DateSegmentType, string>>;
  /** 只读或不可用：不响应输入 */
  readonly?: () => boolean;
}

/** 分段输入的状态与操作 */
export interface DateSegmentsState {
  /** 各段，含分隔符，按语言的顺序 */
  readonly segments: readonly DateSegment[];
  /** 可以输入的段（不含分隔符），Tab 与 ←→ 的顺序 */
  readonly editable: readonly DateSegment[];
  /** 焦点应该在的段：输入满了跳到下一段、Backspace 删空回到上一段时变化 */
  readonly focusedSegment: DateSegmentType | null;
  /** 有段填了、但还没填全 */
  readonly partial: boolean;
  /** 焦点进了某一段（组件的 focusin） */
  setFocused(type: DateSegmentType | null): void;
  /** 在焦点段输入文字（数字、a / p）：逐个字符处理 */
  type(text: string): void;
  /** 焦点段加减 */
  increment(amount: number): void;
  /** 焦点段设成最小 / 最大值 */
  toEdge(edge: 'min' | 'max'): void;
  /** 删掉焦点段的最后一位；已经空了时焦点回到上一段 */
  backspace(): void;
  /** 清空所有段 */
  clear(): void;
  /** 焦点移到相邻的段 */
  moveFocus(direction: 1 | -1): void;
}

/** Page Up / Down 的步长（同 React Aria） */
const BIG_STEPS: Record<DateSegmentType, number> = {
  year: 5,
  month: 2,
  day: 7,
  hour: 2,
  minute: 15,
  second: 15,
  dayPeriod: 1,
};

/** 全角数字、阿拉伯-印度数字 → 半角 */
function normalizeDigits(text: string): string {
  return text
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[\u0660-\u0669]/g, (char) => String(char.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (char) => String(char.charCodeAt(0) - 0x06f0));
}

const daysInMonth = (year: number | undefined, month: number | undefined) =>
  month == null ? 31 : new Date(Date.UTC(year ?? 2000, month, 0)).getUTCDate();

/** 分段输入的状态（组件 setup 里调用） */
export function useDateSegments(config: DateSegmentsOptions): DateSegmentsState {
  // 正在编辑的各字段：可以只填了一部分
  const draft = ref<DateFieldValues>({ ...config.value() });
  // 当前段已经打了的数字（还可能接着打第二位）
  const buffer = ref('');
  const focusedSegment = shallowRef<DateSegmentType | null>(null);

  // 外部的值变了（父级改了、清空了）时以它为准；自己写回的值也会回到这里，结果相同
  watch(
    () => config.value(),
    (value) => {
      if (sameFields(value, complete.value ? draft.value : null)) return;
      draft.value = { ...value };
      buffer.value = '';
    },
  );

  const hour12 = computed(() => {
    const cycle = config.hourCycle?.() ?? resolvedHourCycle(config.locale());
    return cycle === 'h12';
  });

  const fields = computed(() => {
    const list: DateSegmentType[] = [...config.fields()];
    if (hour12.value && list.includes('hour')) list.push('dayPeriod');
    return list;
  });

  const complete = computed(() => config.fields().every((field) => draft.value[field] != null));

  /** 按语言的顺序排好的段（含分隔符）：只取格式化结果的结构，值另外填 */
  const layout = computed(() => {
    const options: Intl.DateTimeFormatOptions = {
      hourCycle: hour12.value ? 'h12' : 'h23',
      timeZone: 'UTC',
    };
    for (const field of config.fields()) {
      options[field] = field === 'year' ? 'numeric' : '2-digit';
    }
    const parts = new Intl.DateTimeFormat(config.locale(), options).formatToParts(SAMPLE);
    const wanted = new Set(fields.value);
    return (
      parts
        .filter((part) => part.type === 'literal' || wanted.has(part.type as DateSegmentType))
        .map((part) => ({ type: part.type as DateSegment['type'], literal: part.value }))
        // 首尾只有空白的分隔符没有意义；“2026年10月”结尾的“月”要留着
        .filter(
          (part, index, all) =>
            part.type !== 'literal' ||
            part.literal.trim() !== '' ||
            (index > 0 && index < all.length - 1),
        )
    );
  });

  const labels = computed(() => {
    const names = new Intl.DisplayNames(config.locale(), { type: 'dateTimeField' });
    return Object.fromEntries(
      fields.value.map((field) => [field, names.of(field) ?? field]),
    ) as Record<DateSegmentType, string>;
  });

  const digits = computed(() => {
    const locale = config.locale();
    const format = (width: number) =>
      new Intl.NumberFormat(locale, { useGrouping: false, minimumIntegerDigits: width });
    return { 1: format(1), 2: format(2), 4: format(4) } as Record<1 | 2 | 4, Intl.NumberFormat>;
  });

  const periods = computed(() => {
    const formatter = new Intl.DateTimeFormat(config.locale(), {
      hour: 'numeric',
      hourCycle: 'h12',
      timeZone: 'UTC',
    });
    const period = (hour: number) =>
      formatter.formatToParts(Date.UTC(2000, 0, 1, hour)).find((part) => part.type === 'dayPeriod')
        ?.value ?? (hour < 12 ? 'AM' : 'PM');
    return [period(0), period(12)] as const;
  });

  function range(type: DateSegmentType): [number, number] {
    switch (type) {
      case 'year':
        return [1, 9999];
      case 'month':
        return [1, 12];
      case 'day':
        return [1, daysInMonth(draft.value.year, draft.value.month)];
      case 'hour':
        return hour12.value ? [1, 12] : [0, 23];
      case 'minute':
      case 'second':
        return [0, 59];
      case 'dayPeriod':
        return [0, 1];
    }
  }

  /** 段上显示的值：12 小时制的时显示 1–12，上午 / 下午是 0 / 1 */
  function shown(type: DateSegmentType): number | null {
    const hour = draft.value.hour;
    if (type === 'dayPeriod') return hour == null ? null : hour >= 12 ? 1 : 0;
    if (type === 'hour' && hour12.value && hour != null) return hour % 12 || 12;
    return draft.value[type] ?? null;
  }

  function text(type: DateSegmentType, value: number | null): string {
    if (type === 'dayPeriod') return value == null ? '' : periods.value[value as 0 | 1];
    if (buffer.value && focusedSegment.value === type)
      return digits.value[1].format(Number(buffer.value));
    if (value == null) return '';
    const width = type === 'year' ? 4 : type === 'hour' && hour12.value ? 1 : 2;
    return digits.value[width].format(value);
  }

  const segments = computed((): DateSegment[] =>
    layout.value.map(({ type, literal }) => {
      if (type === 'literal')
        return { type, text: literal, placeholder: false, value: null, min: 0, max: 0, label: '' };
      const value = shown(type);
      const [min, max] = range(type);
      const filled = text(type, value);
      return {
        type,
        text: filled || (config.placeholders()[type] ?? '––'),
        placeholder: !filled,
        value,
        min,
        max,
        label: labels.value[type],
      };
    }),
  );
  const editable = computed(() => segments.value.filter((segment) => segment.type !== 'literal'));

  /** 写一段的值（显示值：12 小时制的时是 1–12）；写完检查是否填全 */
  function write(type: DateSegmentType, value: number | null) {
    const next = { ...draft.value };
    if (type === 'dayPeriod') {
      if (next.hour == null || value == null) return;
      next.hour = (next.hour % 12) + value * 12;
    } else if (type === 'hour' && hour12.value && value != null) {
      const afternoon = (draft.value.hour ?? config.placeholderValue().hour ?? 0) >= 12;
      next.hour = (value % 12) + (afternoon ? 12 : 0);
    } else if (value == null) delete next[type];
    else next[type] = value;
    const wasComplete = complete.value;
    draft.value = next;
    if (complete.value) config.onChange(constrained(next));
    else if (wasComplete) config.onChange(null);
  }

  // 日超过了这个月的天数（先填了 31 再把月改成 2 月）：写回时取这个月的最后一天
  function constrained(values: DateFieldValues): DateFieldValues {
    if (values.day == null) return values;
    return { ...values, day: Math.min(values.day, daysInMonth(values.year, values.month)) };
  }

  const current = () => focusedSegment.value;

  const state: DateSegmentsState = {
    get segments() {
      return segments.value;
    },
    get editable() {
      return editable.value;
    },
    get focusedSegment() {
      return focusedSegment.value;
    },
    get partial() {
      return !complete.value && config.fields().some((field) => draft.value[field] != null);
    },
    setFocused(type) {
      if (type !== focusedSegment.value) buffer.value = '';
      focusedSegment.value = type;
    },
    type(input) {
      if (!current() || config.readonly?.()) return;
      for (const char of normalizeDigits(input)) {
        const segment = current();
        if (!segment) return;
        if (segment === 'dayPeriod') {
          const lower = char.toLocaleLowerCase();
          const [am, pm] = periods.value.map((label) => label.toLocaleLowerCase());
          if (lower === 'a' || am!.startsWith(lower)) write('dayPeriod', 0);
          else if (lower === 'p' || pm!.startsWith(lower)) write('dayPeriod', 1);
          else continue;
          state.moveFocus(1);
          continue;
        }
        if (!/\d/.test(char)) continue;
        const [min, max] = range(segment);
        let next = buffer.value + char;
        // 打了这一位就超出范围：从这一位重新开始
        if (Number(next) > max) next = char;
        buffer.value = next;
        const number = Number(next);
        // 0 还不是合法值（月、日、12 小时制的时）：先记着，等下一位
        if (number >= min) write(segment, number);
        const maxDigits = String(max).length;
        if (next.length >= maxDigits || number * 10 > max) {
          buffer.value = '';
          if (number < min) write(segment, min);
          state.moveFocus(1);
        }
      }
    },
    increment(amount) {
      const type = current();
      if (!type || config.readonly?.()) return;
      buffer.value = '';
      const [min, max] = range(type);
      const value = shown(type);
      if (value == null) {
        const start = config.placeholderValue();
        if (type === 'dayPeriod') {
          if (draft.value.hour == null)
            write('hour', hour12.value ? (start.hour ?? 0) % 12 || 12 : (start.hour ?? 0));
          write('dayPeriod', (start.hour ?? 0) >= 12 ? 1 : 0);
          return;
        }
        const initial =
          type === 'hour' && hour12.value ? (start.hour ?? 0) % 12 || 12 : (start[type] ?? min);
        write(type, initial);
        return;
      }
      const size = max - min + 1;
      write(type, ((((value - min + amount) % size) + size) % size) + min);
    },
    toEdge(edge) {
      const type = current();
      if (!type || config.readonly?.()) return;
      buffer.value = '';
      const [min, max] = range(type);
      write(type, edge === 'min' ? min : max);
    },
    backspace() {
      const type = current();
      if (!type || config.readonly?.()) return;
      const value = shown(type);
      if (value == null && !buffer.value) {
        state.moveFocus(-1);
        return;
      }
      const digitsLeft = type === 'dayPeriod' ? '' : (buffer.value || String(value)).slice(0, -1);
      buffer.value = digitsLeft;
      const [min] = range(type);
      if (type === 'dayPeriod' || !digitsLeft) {
        if (type === 'dayPeriod' || type === 'hour') {
          // 删掉上午 / 下午或时：时没有了，两段一起清空
          const next = { ...draft.value };
          delete next.hour;
          const wasComplete = complete.value;
          draft.value = next;
          if (wasComplete) config.onChange(null);
          return;
        }
        write(type, null);
        return;
      }
      if (Number(digitsLeft) >= min) write(type, Number(digitsLeft));
    },
    clear() {
      buffer.value = '';
      const wasComplete = complete.value;
      draft.value = {};
      if (wasComplete) config.onChange(null);
    },
    moveFocus(direction) {
      const list = editable.value;
      const index = list.findIndex((segment) => segment.type === current());
      const next = list[index + direction];
      if (next) state.setFocused(next.type as DateSegmentType);
    },
  };
  return state;
}

/**
 * 分段输入的键盘操作：↑↓ 加减、Page Up / Down 大步、Home / End 最小 / 最大、Backspace / Delete 删除、
 * ←→ 换段（从右到左排版时反过来）。数字与字母走 beforeinput（软键盘、输入法也能输入），这里不处理。
 * 返回是否处理了这个按键（处理了就该 preventDefault）
 */
export function handleSegmentKeydown(
  state: DateSegmentsState,
  event: KeyboardEvent,
  rtl = false,
): boolean {
  if (event.altKey || event.ctrlKey || event.metaKey) return false;
  const type = state.focusedSegment;
  if (!type) return false;
  const forward = rtl ? -1 : 1;
  const actions: Record<string, () => void> = {
    ArrowUp: () => state.increment(1),
    ArrowDown: () => state.increment(-1),
    PageUp: () => state.increment(BIG_STEPS[type]),
    PageDown: () => state.increment(-BIG_STEPS[type]),
    Home: () => state.toEdge('min'),
    End: () => state.toEdge('max'),
    Backspace: () => state.backspace(),
    Delete: () => state.backspace(),
    ArrowRight: () => state.moveFocus(forward as 1 | -1),
    ArrowLeft: () => state.moveFocus(-forward as 1 | -1),
  };
  const action = actions[event.key];
  if (!action) return false;
  action();
  return true;
}

// ───────── 内部实现 ─────────

/** 取段的顺序用的任意时刻（各段都是两位数，排版不受值影响） */
const SAMPLE = Date.UTC(2000, 10, 22, 13, 44, 55);

/** 语言默认的小时制 */
function resolvedHourCycle(locale: string): keyof HourCycles {
  const cycle = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle;
  return cycle === 'h11' || cycle === 'h12' ? 'h12' : 'h23';
}

function sameFields(a: DateFieldValues | null, b: DateFieldValues | null): boolean {
  if (a == null || b == null) return a === b;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof DateFieldValues>;
  return [...keys].every((key) => a[key] === b[key]);
}

// ───────── 值与 ISO 字符串 ─────────

/** 日期类分段的粒度：DateField 精确到哪一段（到时、分、秒时是日期加时间） */
export interface DateFieldGranularities {
  /** 只有年：'2026' */
  year: unknown;
  /** 年月：'2026-10'（同原生 input type="month"） */
  month: unknown;
  /** 年月日（默认）：'2026-10-20' */
  day: unknown;
  /** 日期加时：'2026-10-20T14:00' */
  hour: unknown;
  /** 日期加时分：'2026-10-20T14:30'（同原生 input type="datetime-local"） */
  minute: unknown;
  /** 日期加时分秒：'2026-10-20T14:30:15' */
  second: unknown;
}

/** 分段输入精确到哪一段 */
export type DateFieldGranularity = keyof DateFieldGranularities;

type ValueField = Exclude<DateSegmentType, 'dayPeriod'>;

const ALL_FIELDS: readonly ValueField[] = ['year', 'month', 'day', 'hour', 'minute', 'second'];

/** 日期分段：从年到 granularity；time 时只取时间的部分（TimeField） */
export function segmentFields(granularity: DateFieldGranularity, time = false): ValueField[] {
  const fields = ALL_FIELDS.slice(0, ALL_FIELDS.indexOf(granularity) + 1);
  return time
    ? fields.filter((field) => field === 'hour' || field === 'minute' || field === 'second')
    : fields;
}

const pad = (value: number, width = 2) => String(value).padStart(width, '0');

/** 各段的值 → ISO 字符串（按有哪些段：'2026'、'2026-10'、'2026-10-20'、'2026-10-20T14:30'、'14:30'） */
export function fieldsToIso(values: DateFieldValues, fields: readonly ValueField[]): string {
  const date = [
    values.year != null && pad(values.year, 4),
    fields.includes('month') && pad(values.month ?? 1),
    fields.includes('day') && pad(values.day ?? 1),
  ]
    .filter((part) => part !== false)
    .join('-');
  if (!fields.includes('hour')) return date;
  const time = [
    pad(values.hour ?? 0),
    pad(values.minute ?? 0),
    fields.includes('second') && pad(values.second ?? 0),
  ]
    .filter((part) => part !== false)
    .join(':');
  return fields.includes('year') ? `${date}T${time}` : time;
}

/** ISO 字符串 → 各段的值；格式不对时 null。只取 fields 里有的段（'2026-10-20T14:30' 给 DateField 时只要日期） */
export function isoToFields(
  value: string | null | undefined,
  fields: readonly ValueField[],
): DateFieldValues | null {
  if (!value) return null;
  const match = /^(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:T?(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(
    value,
  );
  if (!match) return null;
  const parsed: DateFieldValues = {};
  ALL_FIELDS.forEach((field, index) => {
    const text = match[index + 1];
    if (fields.includes(field) && text != null) parsed[field] = Number(text);
  });
  return fields.every((field) => parsed[field] != null) ? parsed : null;
}
