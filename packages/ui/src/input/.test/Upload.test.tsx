// FileDrop：accept 的匹配、拖放过滤；Upload：上传进度与结果、失败重试、移除时中止、大小上限、单选替换
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { FileDrop, matchesAccept } from '../FileDrop';
import { Upload, type UploadFile, type UploadHandler } from '../Upload';

const file = (name: string, type = 'text/plain', size = 4) =>
  new File(['x'.repeat(size)], name, { type });
const flush = async () => {
  for (let i = 0; i < 3; i++) await nextTick();
};

/** 把文件拖放到区域上 */
function drop(root: Element, files: File[]) {
  const label = root.querySelector('label')!;
  const dataTransfer = { types: ['Files'], files, dropEffect: 'none' };
  for (const type of ['dragenter', 'drop']) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
    label.dispatchEvent(event);
  }
}

describe('matchesAccept', () => {
  it('扩展名、通配类型、确切类型；不写 accept 时都接受', () => {
    expect(matchesAccept(file('a.PDF', 'application/pdf'), '.pdf')).toBe(true);
    expect(matchesAccept(file('a.png', 'image/png'), 'image/*, .pdf')).toBe(true);
    expect(matchesAccept(file('a.txt'), 'image/*,application/json')).toBe(false);
    expect(matchesAccept(file('a.txt'), undefined)).toBe(true);
  });
});

describe('FileDrop', () => {
  it('拖进来的文件按 accept 分成接受与拒绝两份；单选时只取第一个', () => {
    const onFiles = vi.fn();
    const onReject = vi.fn();
    const root = mount(() => <FileDrop accept="image/*" onFiles={onFiles} onReject={onReject} />);
    const png = file('a.png', 'image/png');
    const jpg = file('b.jpg', 'image/jpeg');
    const txt = file('c.txt');
    drop(root, [png, jpg, txt]);
    expect(onFiles).toHaveBeenCalledWith([png]);
    expect(onReject).toHaveBeenCalledWith([txt]);
    expect(root.querySelector('input')!.type).toBe('file');
  });

  it('部件属性：提示文字与说明是两个部件', () => {
    const root = mount(() => (
      <FileDrop
        description="最大 5 MB"
        propsHint={{ class: 'hint' }}
        propsDescription={{ class: 'description' }}
      />
    ));
    expect(root.querySelector('.hint')!.textContent).toBe('点击或拖放文件到这里');
    expect(root.querySelector('.description')!.textContent).toBe('最大 5 MB');
  });
});

describe('Upload', () => {
  it('选到文件就上传：进度、完成后记下结果；失败时可以重试', async () => {
    let list = _state<UploadFile[]>([]);
    const calls: { resolve: (value: unknown) => void; reject: (error: Error) => void }[] = [];
    const upload: UploadHandler = (_, { onProgress }) =>
      new Promise((resolve, reject) => {
        onProgress(0.5);
        calls.push({ resolve, reject });
      });
    const root = mount(() => <Upload value={_bind(list)} multiple upload={upload} />);
    drop(root, [file('a.txt'), file('b.txt')]);
    await flush();
    expect(list.map((item) => item.status)).toEqual(['uploading', 'uploading']);
    expect(list[0]!.progress).toBe(0.5);
    expect(root.querySelectorAll('[role="progressbar"]')).toHaveLength(2);

    calls[0]!.resolve({ url: '/a.txt' });
    calls[1]!.reject(new Error('网络错误'));
    await flush();
    expect(list[0]).toMatchObject({ status: 'done', response: { url: '/a.txt' } });
    expect(list[1]).toMatchObject({ status: 'error', error: '网络错误' });

    root.querySelector<HTMLButtonElement>('[aria-label="重新上传 b.txt"]')!.click();
    await flush();
    expect(list[1]!.status).toBe('uploading');
    calls[2]!.resolve(null);
    await flush();
    expect(list[1]!.status).toBe('done');
  });

  it('移除正在上传的文件时中止', async () => {
    let list = _state<UploadFile[]>([]);
    let signal: AbortSignal | undefined;
    const upload: UploadHandler = (_, context) => {
      signal = context.signal;
      return new Promise(() => {});
    };
    const root = mount(() => <Upload value={_bind(list)} upload={upload} />);
    drop(root, [file('a.txt')]);
    await flush();
    root.querySelector<HTMLButtonElement>('[aria-label="移除 a.txt"]')!.click();
    await flush();
    expect(signal!.aborted).toBe(true);
    expect(list).toEqual([]);
  });

  it('超过 maxSize 的文件列出错误、不上传；单选时新文件替换旧的', async () => {
    let list = _state<UploadFile[]>([]);
    const upload = vi.fn<UploadHandler>(() => Promise.resolve());
    const root = mount(() => <Upload value={_bind(list)} maxSize={10} upload={upload} />);
    drop(root, [file('big.txt', 'text/plain', 2000)]);
    await flush();
    expect(list[0]).toMatchObject({ status: 'error', rejected: true });
    expect(list[0]!.error).toContain('10');
    expect(upload).not.toHaveBeenCalled();
    drop(root, [file('small.txt')]);
    await flush();
    expect(list.map((item) => item.file.name)).toEqual(['small.txt']);
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it('部件属性：每一项的 body、文件名、大小或错误、进度条；进度值由组件决定', () => {
    const items: UploadFile[] = [
      { id: 'a', file: file('a.txt'), status: 'uploading', progress: 0.5 },
      { id: 'b', file: file('b.txt'), status: 'error', error: '网络错误' },
    ];
    const root = mount(() => (
      <Upload
        value={items}
        propsBody={{ class: 'body' }}
        propsName={{ class: 'name' }}
        propsMeta={{ class: 'meta' }}
        propsProgress={{ class: 'progress', value: 10 }}
      />
    ));
    expect(root.querySelectorAll('li .body')).toHaveLength(2);
    expect([...root.querySelectorAll('.name')].map((span) => span.textContent)).toEqual([
      'a.txt',
      'b.txt',
    ]);
    expect(root.querySelector('.meta')!.textContent).toBe('网络错误');
    const progress = root.querySelector('.progress[role="progressbar"]')!;
    expect(progress.getAttribute('aria-valuenow')).toBe('50');
  });
});
