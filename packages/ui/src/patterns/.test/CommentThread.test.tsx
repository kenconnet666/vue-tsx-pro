// CommentThread：留言与回复的结构、提及高亮、附件、相对时间；回复带“@作者 ”与 replyTo、Ctrl + Enter 发送；
// 发送失败保留内容并提示；没有 onSend 时只读；没有留言时的提示
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { CommentThread, type CommentDraft, type CommentItem } from '../CommentThread';

beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});

const flush = async () => {
  for (let i = 0; i < 4; i++) await nextTick();
};

const people = [
  { value: 'U01', label: '周宁' },
  { value: 'U02', label: '陆川' },
];
const now = Date.parse('2026-10-24T10:00:00Z');

const comments: CommentItem[] = [
  {
    id: 'c1',
    author: '周宁',
    content: '@陆川 报价单已更新，请看附件',
    time: '2026-10-24T09:57:00Z',
    attachments: [{ name: '报价单.xlsx', url: '/files/1', size: 24_000 }],
    replies: [
      {
        id: 'c2',
        author: '陆川',
        content: '收到，下午确认',
        time: '2026-10-24T09:58:00Z',
        edited: true,
      },
    ],
  },
];

/** 在输入框里写好文字 */
async function write(textarea: HTMLTextAreaElement, text: string) {
  textarea.value = text;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  await flush();
}

describe('CommentThread', () => {
  it('留言与回复两层列表；提及高亮、附件链接、相对时间与“已编辑”', () => {
    const root = mount(() => <CommentThread comments={comments} people={people} now={now} />);
    const list = root.querySelector('ul[aria-label="留言"]')!;
    expect(list.children).toHaveLength(1);
    const replies = root.querySelector('ul[aria-label="1 条回复"]')!;
    expect(replies.textContent).toContain('收到，下午确认');
    expect(replies.textContent).toContain('已编辑');
    expect(root.querySelector('a[href="/files/1"]')!.textContent).toBe('报价单.xlsx');
    expect(root.querySelector('time')!.textContent).toBe('3分钟前');
    // 只读：没有输入框与回复按钮
    expect(root.querySelector('textarea')).toBeNull();
    expect(root.querySelector('button')).toBeNull();
  });

  it('回复：输入框开头是“@作者 ”，发送带 replyTo（那一串的第一条），成功后收起', async () => {
    const onSend = vi.fn<(draft: CommentDraft) => void>();
    const root = mount(() => (
      <CommentThread comments={comments} people={people} now={now} onSend={onSend} />
    ));
    const reply = [...root.querySelectorAll('button')].filter(
      (button) => button.textContent === '回复',
    );
    expect(reply).toHaveLength(2);
    reply[1]!.click();
    await flush();
    const textarea = root.querySelector<HTMLTextAreaElement>('textarea[aria-label="回复 陆川"]')!;
    expect(textarea.value).toBe('@陆川 ');
    await write(textarea, '@陆川 好的');
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }),
    );
    await flush();
    expect(onSend).toHaveBeenCalledWith({
      content: '@陆川 好的',
      mentions: ['U02'],
      attachments: [],
      replyTo: 'c1',
    });
    expect(root.querySelector('textarea[aria-label="回复 陆川"]')).toBeNull();
  });

  it('发送失败：内容保留，提示失败', async () => {
    const root = mount(() => (
      <CommentThread
        comments={[]}
        people={people}
        onSend={() => Promise.reject(new Error('网络错误'))}
      />
    ));
    expect(root.textContent).toContain('还没有留言');
    const textarea = root.querySelector<HTMLTextAreaElement>('textarea[aria-label="留言"]')!;
    const send = () => [...root.querySelectorAll('button')].find((b) => b.textContent === '发送')!;
    expect(send().disabled).toBe(true);
    await write(textarea, '请尽快确认');
    send().click();
    await flush();
    expect(root.querySelector('[role="alert"]')!.textContent).toContain('发送失败');
    expect(textarea.value).toBe('请尽快确认');
  });
});
