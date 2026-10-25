// FileDrop：accept 的匹配、拖放过滤；Upload：上传进度与结果、失败重试、移除时中止、大小上限、单选替换；图片墙、粘贴、排序
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { Provider } from '../../config/Provider';
import { Field } from '../../form/Field';
import type { HttpClient, HttpRequest } from '../../utils/request/http';
import { mount } from '../../utils/.test/mount';
import { FileDrop, matchesAccept } from '../FileDrop';
import { existingUploadFile, Upload, type UploadFile, type UploadHandler } from '../Upload';

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
    const root = mount(() => <Upload _value={_bind(list)} multiple upload={upload} />);
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

  it('action：用配置的请求客户端 POST（multipart，字段名 fieldName），响应记在 response 上', async () => {
    let list = _state<UploadFile[]>([]);
    const requests: HttpRequest[] = [];
    const http: HttpClient = {
      request: (request) => {
        requests.push(request);
        return Promise.resolve({ url: '/files/1' } as never);
      },
    };
    const root = mount(() => (
      <Provider http={http}>
        <Upload _value={_bind(list)} action="/files" fieldName="attachment" />
      </Provider>
    ));
    drop(root, [file('a.txt')]);
    await flush();
    await flush();
    expect(requests[0]).toMatchObject({ method: 'POST', url: '/files' });
    expect((requests[0]!.body as FormData).get('attachment')).toBeInstanceOf(File);
    expect(requests[0]!.signal).toBeInstanceOf(AbortSignal);
    expect(list[0]).toMatchObject({ status: 'done', response: { url: '/files/1' } });
  });

  it('移除正在上传的文件时中止', async () => {
    let list = _state<UploadFile[]>([]);
    let signal: AbortSignal | undefined;
    const upload: UploadHandler = (_, context) => {
      signal = context.signal;
      return new Promise(() => {});
    };
    const root = mount(() => <Upload _value={_bind(list)} upload={upload} />);
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
    const root = mount(() => <Upload _value={_bind(list)} maxSize={10} upload={upload} />);
    drop(root, [file('big.txt', 'text/plain', 2000)]);
    await flush();
    expect(list[0]).toMatchObject({ status: 'error', rejected: true });
    expect(list[0]!.error).toContain('10');
    expect(upload).not.toHaveBeenCalled();
    drop(root, [file('small.txt')]);
    await flush();
    expect(list.map((item) => item.name)).toEqual(['small.txt']);
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it('部件属性：每一项的 body、文件名、大小或错误、进度条；进度与名称由组件决定', () => {
    const items: UploadFile[] = [
      { id: 'a', name: 'a.txt', file: file('a.txt'), status: 'uploading', progress: 0.5 },
      { id: 'b', name: 'b.txt', file: file('b.txt'), status: 'error', error: '网络错误' },
    ];
    const root = mount(() => (
      <Upload
        _value={items}
        propsBody={{ class: 'body' }}
        propsName={{ class: 'name' }}
        propsMeta={{ class: 'meta' }}
        propsProgress={{ class: 'progress', size: 'sm' }}
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
    expect(progress.getAttribute('aria-label')).toBe('a.txt');
  });

  it('部件属性：文件图标、重试、移除；每项的名称、点击与不可用由组件管理', async () => {
    let list = _state<UploadFile[]>([
      { id: 'a', name: 'a.txt', file: file('a.txt'), status: 'error', error: '网络错误' },
    ]);
    const upload = vi.fn<UploadHandler>(() => new Promise(() => {}));
    const root = mount(() => (
      <Upload
        _value={_bind(list)}
        upload={upload}
        disabled
        propsIcon={{ class: 'icon' }}
        propsRetry={{ class: 'retry', variant: 'soft' }}
        propsRemove={{ class: 'remove' }}
      />
    ));
    expect(root.querySelector('li svg.icon')).not.toBeNull();
    expect(root.querySelector<HTMLButtonElement>('button.remove')!.disabled).toBe(true);
    const retry = root.querySelector<HTMLButtonElement>('button.retry')!;
    // 名称带文件名：列表里每一项的按钮读屏能区分
    expect(retry.getAttribute('aria-label')).toBe('重新上传 a.txt');
    retry.click();
    await flush();
    expect(upload).toHaveBeenCalledTimes(1);
    expect(list[0]!.status).toBe('uploading');
  });
  it('已有文件：状态是完成，文件名链到地址；不重新上传，可以移除', async () => {
    let list = _state<UploadFile[]>([
      existingUploadFile({ name: '验证报告.pdf', url: '/files/7' }),
      existingUploadFile({ name: '评审纪要.pdf', size: 2048 }),
    ]);
    const upload = vi.fn<UploadHandler>();
    const root = mount(() => <Upload _value={_bind(list)} upload={upload} multiple />);
    const items = root.querySelectorAll('li');
    expect([...items].map((item) => item.dataset.state)).toEqual(['done', 'done']);
    expect(items[0]!.querySelector('a')!.getAttribute('href')).toBe('/files/7');
    expect(items[1]!.textContent).toContain('2 kB');
    expect(upload).not.toHaveBeenCalled();
    items[0]!.querySelector<HTMLButtonElement>('button[aria-label="移除 验证报告.pdf"]')!.click();
    await flush();
    expect(list.map((item) => item.name)).toEqual(['评审纪要.pdf']);
  });

  it('读 Field 的只读与不可用；已有文件时选择框不再原生必填（它选完就清空，否则表单交不了）', async () => {
    const files: UploadFile[] = [{ id: 'a', name: 'a.txt', file: file('a.txt'), status: 'done' }];
    const root = mount(() => (
      <>
        <Field label="附件" readonly>
          <Upload _value={files} class="readonly" />
        </Field>
        <Field label="附件" disabled>
          <Upload _value={files} class="disabled" />
        </Field>
        <Field label="附件" required>
          <Upload _value={files} class="filled" />
        </Field>
        <Field label="附件" required>
          <Upload class="empty" />
        </Field>
      </>
    ));
    await flush();
    const readonly = root.querySelector('.readonly')!;
    expect(readonly.querySelector('input[type=file]')).toBeNull();
    expect(readonly.querySelector('button')).toBeNull();
    expect(root.querySelector<HTMLButtonElement>('.disabled button')!.disabled).toBe(true);
    expect(root.querySelector<HTMLInputElement>('.disabled input[type=file]')!.disabled).toBe(true);
    expect(root.querySelector<HTMLInputElement>('.filled input[type=file]')!.required).toBe(false);
    const empty = root.querySelector<HTMLInputElement>('.empty input[type=file]')!;
    expect(empty.required).toBe(true);
    // 选择框照常从 Field 拿 id：标签指向它
    expect(empty.id).toBe(root.querySelectorAll('label[for]')[3]!.getAttribute('for'));
  });
});

describe('Upload 的图片墙', () => {
  it('picture：图片是可以点开的缩略图（本地地址），别的文件是图标与文件名；选文件的区域是最后一格', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    let files = _state<UploadFile[]>([]);
    const root = mount(() => (
      <Upload _value={_bind(files)} listType="picture" multiple accept="image/*,.pdf" />
    ));
    drop(root, [file('支架.png', 'image/png'), file('报告.pdf', 'application/pdf')]);
    await flush();
    const cards = [...root.querySelectorAll('[role="listitem"]')];
    expect(cards).toHaveLength(2);
    expect(
      cards[0]!.querySelector('button[aria-label="查看大图：支架.png"] img')!.getAttribute('src'),
    ).toBe('blob:preview');
    expect(cards[1]!.textContent).toContain('报告.pdf');
    // 选文件的区域紧跟在列表后面（不是列表项），和缩略图排在一行
    expect(root.querySelector('[role="list"] + label')!.textContent).toContain('添加图片');
    createObjectURL.mockRestore();
  });

  it('pasteable：粘贴的图片加进来，不在 accept 里的列出、带错误；sortable：把手用键盘移动', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    let files = _state<UploadFile[]>([]);
    const root = mount(() => (
      <Upload
        _value={_bind(files)}
        listType="picture"
        multiple
        accept="image/*"
        pasteable
        sortable
      />
    ));
    const paste = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(paste, 'clipboardData', {
      value: { files: [file('截图.png', 'image/png'), file('说明.txt')] },
    });
    root.querySelector('label')!.dispatchEvent(paste);
    await flush();
    expect(files.map((item) => [item.name, item.status])).toEqual([
      ['截图.png', 'selected'],
      ['说明.txt', 'error'],
    ]);
    expect(root.textContent).toContain('也可以粘贴图片');

    const handle = root.querySelector<HTMLButtonElement>('button[aria-label="移动 截图.png"]')!;
    handle.focus();
    for (const key of [' ', 'ArrowRight', ' '])
      handle.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    await flush();
    expect(files.map((item) => item.name)).toEqual(['说明.txt', '截图.png']);
    vi.restoreAllMocks();
  });
});

it('列表模式的选择区域照常有图标与默认提示（不传子元素）', () => {
  const root = mount(() => <Upload description="不超过 2 MB" />);
  const label = root.querySelector('label')!;
  expect(label.querySelector('svg')).not.toBeNull();
  expect(label.textContent).toContain('不超过 2 MB');
  expect(label.textContent!.length).toBeGreaterThan('不超过 2 MB'.length);
});
