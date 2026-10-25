// Mentions：@ 弹出过滤后的人员、选中写成“@名字 ”、mentions 随文字增删、Esc 关掉后这个 @ 不再弹出、邮箱里的 @ 不算；
// mentionSegments 取最长的匹配；MentionText 高亮提及
import { beforeAll, describe, expect, it } from 'vitest';
import { nextTick, reactive } from 'vue';
import { hasStyles, mount } from '../../utils/.test/mount';
import {
  mentionedValues,
  Mentions,
  mentionSegments,
  mentionStyles,
  MentionText,
} from '../Mentions';

// happy-dom 没有 popover 的方法
beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});

const flush = async () => {
  for (let i = 0; i < 4; i++) await nextTick();
};

const people = [
  { value: 'U01', label: '林小满' },
  { value: 'U02', label: '林小' },
  { value: 'U03', label: '陆川' },
  { value: 'U04', label: '周宁' },
];

function render(initial = '') {
  const state = reactive({ text: initial, mentions: [] as string[] });
  const root = mount(() => (
    <Mentions _value={state.text} _mentions={state.mentions} items={people} aria-label="留言" />
  ));
  const textarea = root.querySelector('textarea')!;
  const type = async (text: string) => {
    textarea.focus();
    textarea.value = text;
    textarea.setSelectionRange(text.length, text.length);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await flush();
  };
  const key = async (name: string) => {
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
    await flush();
  };
  const options = () =>
    [...document.querySelectorAll('[role="option"]')].map((option) => option.textContent);
  return { root, state, textarea, type, key, options };
}

describe('mentionSegments', () => {
  it('按显示文字拆出提及，有多个能匹配时取最长的；邮箱里的 @ 不算', () => {
    const segments = mentionSegments('请@林小满 看下，抄送 a@陆川.com 与 @周宁', people);
    expect(segments.map((segment) => [segment.text, segment.mention?.value])).toEqual([
      ['请', undefined],
      ['@林小满', 'U01'],
      [' 看下，抄送 a@陆川.com 与 ', undefined],
      ['@周宁', 'U04'],
    ]);
    expect(mentionedValues('@周宁 @林小满 @周宁', people)).toEqual(['U04', 'U01']);
  });
});

describe('Mentions', () => {
  it('输入 @ 弹出全部，接着输入按名字过滤；Enter 选中写成“@名字 ”，mentions 跟着更新', async () => {
    const { state, textarea, type, key, options } = render();
    await type('请 @');
    expect(options()).toEqual(['林小满', '林小', '陆川', '周宁']);
    expect(textarea.getAttribute('aria-controls')).not.toBeNull();
    await type('请 @林');
    expect(options()).toEqual(['林小满', '林小']);
    expect(textarea.getAttribute('aria-activedescendant')).not.toBeNull();
    await key('Enter');
    expect(state.text).toBe('请 @林小满 ');
    expect(state.mentions).toEqual(['U01']);
    expect(textarea.getAttribute('aria-controls')).toBeNull();

    // 删掉“@林小满”就不再算提及
    await type('请 ');
    expect(state.mentions).toEqual([]);
  });

  it('Esc 关掉后这个 @ 不再弹出，换一个 @ 照常；@ 后面有空白或前面是字母数字时不弹出', async () => {
    const { textarea, type, key } = render();
    await type('@陆');
    expect(textarea.getAttribute('aria-controls')).not.toBeNull();
    await key('Escape');
    expect(textarea.getAttribute('aria-controls')).toBeNull();
    await type('@陆川');
    expect(textarea.getAttribute('aria-controls')).toBeNull();
    await type('@陆川 @');
    expect(textarea.getAttribute('aria-controls')).not.toBeNull();
    await type('@陆川 @周 ');
    expect(textarea.getAttribute('aria-controls')).toBeNull();
    await type('lin@');
    expect(textarea.getAttribute('aria-controls')).toBeNull();
  });

  it('父级给的文字里已有的提及也算进 mentions', async () => {
    const { state } = render('@周宁 请确认');
    await flush();
    expect(state.mentions).toEqual(['U04']);
  });
});

describe('MentionText', () => {
  it('提及高亮成单独的 span，其余文字原样', () => {
    const root = mount(() => (
      <MentionText
        text="@陆川 收到"
        options={people}
        propsMention={(mention) => ({ title: mention.value })}
      />
    ));
    const mention = root.querySelector('[title]')!;
    expect(mention.textContent).toBe('@陆川');
    expect(mention.getAttribute('title')).toBe('U03');
    expect(hasStyles(mention, mentionStyles.mention)).toBe(true);
    expect(root.textContent).toBe('@陆川 收到');
  });
});
