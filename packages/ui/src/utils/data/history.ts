/**
 * 撤销重做：记下一份状态的各个版本，撤销、重做时把记下的版本写回去。设计器、画布、富编辑器这类“改了还能退回去”的地方用它。
 * 参考 VueUse 的 useManualRefHistory（手动提交、限制步数）与 ProseMirror 的 history（连续输入在一段时间内合成一步）。
 *
 *   const doc = _state({ … });
 *   const history = createHistory({ read: () => doc, write: (value) => Object.assign(doc, value) });
 *   rename(node, name);  history.commit('改名称', { merge: `name:${node.id}` });   // 逐字输入合成一步
 *   const drag = history.begin('移动节点');  …拖动中随便改…  drag.end();          // 松开时记一步，Esc 时 drag.cancel()
 *   <IconButton disabled={!history.canUndo} onClick={history.undo} label={`撤销 ${history.undoLabel ?? ''}`} />
 *
 * 记的是快照：每一步一份深拷贝（默认 snapshot，去掉响应式代理）。几十 KB 的定义记 100 步也只有几 MB，
 * 不做补丁：补丁要么要求状态按不可变方式更新，要么每次都要深比较，换来的内存不值这份复杂度。
 * 状态本来就按不可变方式更新时，clone 写成 (value) => value，每一步只存一个引用。
 * 保存点：markSaved() 记下当前这一步，dirty 表示现在与保存时不同（撤销回保存点时又变回 false）。
 * 不在 setup 里也能用（只用 Vue 的 shallowRef），快捷键（Mod+Z、Mod+Shift+Z）由使用方接上 useHotkeys。
 */
import { snapshot } from '@zerodep-dev/vue-tsx-pro-tsx';
import { shallowRef } from 'vue';
import { sameValue } from './equality';

/** createHistory 的选项 */
export interface HistoryOptions<T> {
  /** 读当前的状态 */
  read: () => T;
  /** 撤销、重做时把记下的版本写回状态（拿到的是一份拷贝，可以直接放进状态里） */
  write: (value: T) => void;
  /** 最多记多少步（不算起点），默认 100；超出时丢掉最早的 */
  limit?: number;
  /** 同一个 merge 键的连续提交，间隔不超过多少毫秒就合成一步，默认 500 */
  mergeWindow?: number;
  /** 记下一个版本时怎样复制，默认 snapshot（深拷贝、去掉代理）；状态按不可变方式更新时写 (value) => value */
  clone?: (value: T) => T;
  /** 与上一步是否相同（相同就不记），默认结构相等（sameValue） */
  equals?: (a: T, b: T) => boolean;
}

/** commit 的选项 */
export interface HistoryCommitOptions {
  /**
   * 合并的键：与上一步的键相同、间隔在 mergeWindow 以内时并进上一步（逐字输入、连续微调）。
   * 键里带上对象，例如 `name:${node.id}`，改另一个对象的同一个字段时另起一步
   */
  merge?: string;
}

/** 一次连续的操作（拖动、调整大小）：期间的改动不记，结束时合成一步 */
export interface HistoryGesture {
  /** 结束：有改动就记成一步 */
  end(): void;
  /** 取消：状态回到开始前（Esc 取消拖动） */
  cancel(): void;
}

/** createHistory 的返回值：状态加方法，交给工具栏、快捷键 */
export interface History {
  /** 有可以撤销的步骤 */
  readonly canUndo: boolean;
  /** 有可以重做的步骤 */
  readonly canRedo: boolean;
  /** 下一次撤销会撤掉的那一步的说明（commit 时写的 label），按钮的提示里用；没有时 undefined */
  readonly undoLabel: string | undefined;
  /** 下一次重做会重做的那一步的说明 */
  readonly redoLabel: string | undefined;
  /** 现在与保存点（markSaved）不同；还没保存过时与起点比 */
  readonly dirty: boolean;
  /** 正在进行一次连续的操作（begin 之后、end 或 cancel 之前） */
  readonly busy: boolean;
  /** 把当前状态记成新的一步；与上一步相同时不记。撤销过再提交会丢掉可以重做的步骤 */
  commit(label?: string, options?: HistoryCommitOptions): void;
  /** 开始一次连续的操作：期间的 commit 不起作用，end 时记一步、cancel 时回到开始前。已有进行中的操作时先结束它 */
  begin(label?: string): HistoryGesture;
  /** 撤销一步 */
  undo(): void;
  /** 重做一步 */
  redo(): void;
  /** 把当前这一步记为已保存：dirty 变回 false */
  markSaved(): void;
  /** 清空历史，以当前状态为新的起点并记为已保存（载入另一份文档、发布之后） */
  reset(): void;
}

interface Entry<T> {
  value: T;
  label: string | undefined;
  merge: string | undefined;
  at: number;
}

/** 撤销重做的历史（在哪里都能调用：不用生命周期与注入） */
export function createHistory<T>(options: HistoryOptions<T>): History {
  const limit = Math.max(1, options.limit ?? 100);
  const mergeWindow = options.mergeWindow ?? 500;
  const clone = options.clone ?? snapshot;
  const equals = options.equals ?? sameValue;

  const entry = (label?: string, merge?: string): Entry<T> => ({
    value: clone(options.read()),
    label,
    merge,
    at: Date.now(),
  });
  // 历史不是响应式数据（快照可能很大）；current、saved 的变化经 revision 通知读取方
  let entries: Entry<T>[] = [entry()];
  let current = 0;
  // 保存点在 entries 里的位置；被 limit 挤掉后是 -1，之后一直算有改动
  let saved = 0;
  let gesture: { label: string | undefined } | undefined;
  const revision = shallowRef(0);
  const touch = () => revision.value++;
  const track = () => revision.value;

  function record(label?: string, merge?: string) {
    const next = entry(label, merge);
    const last = entries[current]!;
    if (equals(next.value, last.value)) return;
    entries.length = current + 1;
    // 合并进上一步：同一个键、间隔不长，且上一步不是起点或保存点（否则撤销会越过它们）
    const merges =
      merge !== undefined &&
      last.merge === merge &&
      next.at - last.at <= mergeWindow &&
      current > 0 &&
      current !== saved;
    if (merges) {
      entries[current] = { ...next, label: last.label ?? label };
    } else {
      entries.push(next);
      current++;
      if (entries.length > limit + 1) {
        const dropped = entries.length - (limit + 1);
        entries = entries.slice(dropped);
        current -= dropped;
        saved = saved - dropped < 0 ? -1 : saved - dropped;
      }
    }
    touch();
  }

  function go(index: number) {
    if (index < 0 || index >= entries.length || index === current) return;
    gesture = undefined;
    current = index;
    options.write(clone(entries[current]!.value));
    touch();
  }

  return {
    get canUndo() {
      track();
      return current > 0;
    },
    get canRedo() {
      track();
      return current < entries.length - 1;
    },
    get undoLabel() {
      track();
      return current > 0 ? entries[current]!.label : undefined;
    },
    get redoLabel() {
      track();
      return entries[current + 1]?.label;
    },
    get dirty() {
      track();
      return current !== saved;
    },
    get busy() {
      track();
      return gesture !== undefined;
    },
    commit(label, commitOptions) {
      if (gesture) return;
      record(label, commitOptions?.merge);
    },
    begin(label) {
      if (gesture) record(gesture.label);
      const own = { label };
      gesture = own;
      touch();
      // 只结束自己：被新的 begin、undo 顶掉之后再调用不起作用
      const finish = (keep: boolean) => {
        if (gesture !== own) return;
        gesture = undefined;
        if (keep) record(label);
        else options.write(clone(entries[current]!.value));
        touch();
      };
      return { end: () => finish(true), cancel: () => finish(false) };
    },
    undo: () => go(current - 1),
    redo: () => go(current + 1),
    markSaved() {
      saved = current;
      touch();
    },
    reset() {
      gesture = undefined;
      entries = [entry()];
      current = 0;
      saved = 0;
      touch();
    },
  };
}
