/**
 * 给 Go 的 WebAssembly 运行时用的内存文件系统（浏览器里没有 Node 的 fs）：实现 Go 的 syscall/fs_js.go 用到的那部分
 * Node 回调式接口——open、read、write、fstat、stat、lstat、readdir、mkdir、unlink、rename……
 * 标准输入（fd 0）从 feed 进来的字节里读，没有数据时等着；标准输出（fd 1）交给 onStdout；标准错误（fd 2）交给 onStderr。
 * 语言服务（tsc --lsp --stdio）读写的就是这里：工作区的文件、依赖包的源码与声明。
 */

type Callback<T = void> = (error: Error | null, value?: T) => void;

/** 一个节点：文件存内容，目录存子项的名字 */
type Entry =
  | { readonly kind: 'file'; data: Uint8Array; mtime: number }
  | { readonly kind: 'dir'; readonly children: Set<string>; mtime: number };

/** 打开的文件 */
interface Handle {
  readonly path: string;
  position: number;
  readonly append: boolean;
}

const S_IFDIR = 0o040000;
const S_IFREG = 0o100000;
/** Go 读的打开方式（同 Linux 的取值） */
const constants = {
  O_RDONLY: 0,
  O_WRONLY: 1,
  O_RDWR: 2,
  O_CREAT: 0o100,
  O_EXCL: 0o200,
  O_TRUNC: 0o1000,
  O_APPEND: 0o2000,
  O_DIRECTORY: 0o200000,
};

/** Node 风格的错误：Go 按 code 换成 errno */
const failure = (code: string, path = '') => Object.assign(new Error(`${code}: ${path}`), { code });

const normalize = (path: string) => {
  const parts: string[] = [];
  for (const part of path.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return `/${parts.join('/')}`;
};
const parentOf = (path: string) => path.slice(0, path.lastIndexOf('/')) || '/';
const nameOf = (path: string) => path.slice(path.lastIndexOf('/') + 1);

export interface MemFsOptions {
  /** 标准输出的字节（语言服务的回复） */
  onStdout: (bytes: Uint8Array) => void;
  /** 标准错误的文字（Go 运行时的报错与栈） */
  onStderr: (text: string) => void;
}

export function createMemFs({ onStdout, onStderr }: MemFsOptions) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const entries = new Map<string, Entry>([
    ['/', { kind: 'dir', children: new Set(), mtime: Date.now() }],
  ]);
  const handles = new Map<number, Handle>();
  let nextFd = 3;

  // 标准输入：喂进来的字节排队，读的人没数据时等
  let stdin = new Uint8Array(0);
  let waitingRead: (() => void) | undefined;

  function mkdirp(path: string) {
    const target = normalize(path);
    if (entries.has(target)) return;
    mkdirp(parentOf(target));
    entries.set(target, { kind: 'dir', children: new Set(), mtime: Date.now() });
    (entries.get(parentOf(target)) as Extract<Entry, { kind: 'dir' }>).children.add(nameOf(target));
  }

  /** 写一个文件（上层目录不存在时建上） */
  function writeFile(path: string, content: string | Uint8Array) {
    const target = normalize(path);
    mkdirp(parentOf(target));
    const data = typeof content === 'string' ? encoder.encode(content) : content;
    entries.set(target, { kind: 'file', data, mtime: Date.now() });
    (entries.get(parentOf(target)) as Extract<Entry, { kind: 'dir' }>).children.add(nameOf(target));
  }

  function removeFile(path: string) {
    const target = normalize(path);
    entries.delete(target);
    (entries.get(parentOf(target)) as Extract<Entry, { kind: 'dir' }> | undefined)?.children.delete(
      nameOf(target),
    );
  }

  /** 给标准输入喂数据（发给语言服务的消息） */
  function feed(bytes: Uint8Array) {
    const merged = new Uint8Array(stdin.length + bytes.length);
    merged.set(stdin);
    merged.set(bytes, stdin.length);
    stdin = merged;
    const wake = waitingRead;
    waitingRead = undefined;
    wake?.();
  }

  const stats = (entry: Entry) => {
    const size = entry.kind === 'file' ? entry.data.length : 0;
    return {
      dev: 1,
      ino: 1,
      mode: entry.kind === 'dir' ? S_IFDIR | 0o755 : S_IFREG | 0o644,
      nlink: 1,
      uid: 0,
      gid: 0,
      rdev: 0,
      size,
      blksize: 4096,
      blocks: Math.ceil(size / 512),
      atimeMs: entry.mtime,
      mtimeMs: entry.mtime,
      ctimeMs: entry.mtime,
      isDirectory: () => entry.kind === 'dir',
    };
  };

  const lookup = (path: string, callback: Callback<ReturnType<typeof stats>>) => {
    const entry = entries.get(normalize(path));
    if (entry) callback(null, stats(entry));
    else callback(failure('ENOENT', path));
  };

  const fs = {
    constants,
    /** Go 运行时的打印（panic、调试输出） */
    writeSync(fd: number, buffer: Uint8Array): number {
      if (fd === 1) onStdout(buffer.slice());
      else onStderr(decoder.decode(buffer));
      return buffer.length;
    },
    write(
      fd: number,
      buffer: Uint8Array,
      offset: number,
      length: number,
      position: number | null,
      callback: Callback<number>,
    ) {
      const bytes = buffer.subarray(offset, offset + length);
      if (fd === 1 || fd === 2) {
        fs.writeSync(fd, bytes);
        return callback(null, length);
      }
      const handle = handles.get(fd);
      const entry = handle && entries.get(handle.path);
      if (!handle || entry?.kind !== 'file') return callback(failure('EBADF'));
      const at = handle.append ? entry.data.length : (position ?? handle.position);
      const grown = new Uint8Array(Math.max(entry.data.length, at + length));
      grown.set(entry.data);
      grown.set(bytes, at);
      entry.data = grown;
      entry.mtime = Date.now();
      if (position === null) handle.position = at + length;
      callback(null, length);
    },
    read(
      fd: number,
      buffer: Uint8Array,
      offset: number,
      length: number,
      position: number | null,
      callback: Callback<number>,
    ) {
      if (fd === 0) {
        const take = () => {
          const n = Math.min(length, stdin.length);
          buffer.set(stdin.subarray(0, n), offset);
          stdin = stdin.subarray(n);
          callback(null, n);
        };
        if (stdin.length > 0) take();
        else waitingRead = take;
        return;
      }
      const handle = handles.get(fd);
      const entry = handle && entries.get(handle.path);
      if (!handle || entry?.kind !== 'file') return callback(failure('EBADF'));
      const at = position ?? handle.position;
      const chunk = entry.data.subarray(at, at + length);
      buffer.set(chunk, offset);
      if (position === null) handle.position = at + chunk.length;
      callback(null, chunk.length);
    },
    open(path: string, flags: number, _mode: number, callback: Callback<number>) {
      const target = normalize(path);
      let entry = entries.get(target);
      if (entry && flags & constants.O_CREAT && flags & constants.O_EXCL)
        return callback(failure('EEXIST', path));
      if (!entry) {
        if (!(flags & constants.O_CREAT)) return callback(failure('ENOENT', path));
        if (!entries.has(parentOf(target))) return callback(failure('ENOENT', path));
        writeFile(target, new Uint8Array(0));
        entry = entries.get(target)!;
      }
      if (entry.kind === 'file' && flags & constants.O_TRUNC) entry.data = new Uint8Array(0);
      const fd = nextFd++;
      handles.set(fd, { path: target, position: 0, append: Boolean(flags & constants.O_APPEND) });
      callback(null, fd);
    },
    close(fd: number, callback: Callback) {
      handles.delete(fd);
      callback(null);
    },
    fstat(fd: number, callback: Callback<ReturnType<typeof stats>>) {
      if (fd <= 2)
        return callback(null, stats({ kind: 'file', data: new Uint8Array(0), mtime: 0 }));
      const handle = handles.get(fd);
      if (!handle) return callback(failure('EBADF'));
      lookup(handle.path, callback);
    },
    stat: lookup,
    lstat: lookup,
    readdir(path: string, callback: Callback<string[]>) {
      const entry = entries.get(normalize(path));
      if (!entry) return callback(failure('ENOENT', path));
      if (entry.kind !== 'dir') return callback(failure('ENOTDIR', path));
      callback(null, [...entry.children]);
    },
    mkdir(path: string, _mode: number, callback: Callback) {
      const target = normalize(path);
      if (entries.has(target)) return callback(failure('EEXIST', path));
      if (!entries.has(parentOf(target))) return callback(failure('ENOENT', path));
      mkdirp(target);
      callback(null);
    },
    unlink(path: string, callback: Callback) {
      if (entries.get(normalize(path))?.kind !== 'file') return callback(failure('ENOENT', path));
      removeFile(path);
      callback(null);
    },
    rmdir(path: string, callback: Callback) {
      const entry = entries.get(normalize(path));
      if (entry?.kind !== 'dir') return callback(failure('ENOENT', path));
      if (entry.children.size > 0) return callback(failure('ENOTEMPTY', path));
      removeFile(path);
      callback(null);
    },
    rename(from: string, to: string, callback: Callback) {
      const entry = entries.get(normalize(from));
      if (entry?.kind !== 'file') return callback(failure('ENOENT', from));
      removeFile(from);
      writeFile(to, entry.data);
      callback(null);
    },
    readlink: (path: string, callback: Callback) => callback(failure('EINVAL', path)),
    // 权限、属主、时间、同步：内存里没有这些，当作成功
    chmod: (_path: string, _mode: number, callback: Callback) => callback(null),
    fchmod: (_fd: number, _mode: number, callback: Callback) => callback(null),
    chown: (_path: string, _uid: number, _gid: number, callback: Callback) => callback(null),
    fchown: (_fd: number, _uid: number, _gid: number, callback: Callback) => callback(null),
    lchown: (_path: string, _uid: number, _gid: number, callback: Callback) => callback(null),
    utimes: (_path: string, _atime: number, _mtime: number, callback: Callback) => callback(null),
    fsync: (_fd: number, callback: Callback) => callback(null),
    truncate(path: string, length: number, callback: Callback) {
      const entry = entries.get(normalize(path));
      if (entry?.kind !== 'file') return callback(failure('ENOENT', path));
      entry.data = entry.data.slice(0, length);
      callback(null);
    },
    ftruncate(fd: number, length: number, callback: Callback) {
      const handle = handles.get(fd);
      if (!handle) return callback(failure('EBADF'));
      fs.truncate(handle.path, length, callback);
    },
    link: (_from: string, _to: string, callback: Callback) => callback(failure('ENOSYS')),
    symlink: (_from: string, _to: string, callback: Callback) => callback(failure('ENOSYS')),
  };

  return { fs, writeFile, removeFile, feed };
}

/** Go 运行时读的进程信息：工作目录固定在工作区 */
export function createProcess(cwd: string) {
  let current = cwd;
  return {
    pid: 1,
    ppid: 0,
    getuid: () => -1,
    getgid: () => -1,
    geteuid: () => -1,
    getegid: () => -1,
    getgroups: () => {
      throw failure('ENOSYS');
    },
    umask: () => 0o022,
    cwd: () => current,
    chdir: (path: string) => {
      current = normalize(path);
    },
  };
}

/** Go 运行时只用到 path.resolve（打开文件后记下绝对路径）：按工作目录解析 */
export function createPath(cwd: () => string) {
  return {
    resolve: (...parts: string[]) =>
      normalize(
        parts.reduce(
          (resolved, part) => (part.startsWith('/') ? part : `${resolved}/${part}`),
          cwd(),
        ),
      ),
  };
}
