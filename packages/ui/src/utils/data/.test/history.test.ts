// 撤销重做：提交、撤销、重做；逐字输入合成一步；连续操作的结束与取消；保存点；步数上限；读取方随之更新
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, reactive } from 'vue';
import { createHistory } from '../history';

interface Doc {
  title: string;
  nodes: { id: string; x: number }[];
}

function setup(options: { limit?: number } = {}) {
  const doc = reactive<Doc>({ title: '采购', nodes: [{ id: 'a', x: 0 }] });
  const history = createHistory<Doc>({
    read: () => doc,
    write: (value) => Object.assign(doc, value),
    ...options,
  });
  return { doc, history };
}

beforeEach(() => vi.useFakeTimers({ now: 0 }));
afterEach(() => vi.useRealTimers());

describe('createHistory', () => {
  it('提交后能撤销、重做，写回的是记下时的样子', () => {
    const { doc, history } = setup();
    expect(history.canUndo).toBe(false);
    doc.title = '采购申请';
    history.commit('改名称');
    doc.nodes[0]!.x = 40;
    history.commit('移动节点');
    expect(history.undoLabel).toBe('移动节点');

    history.undo();
    expect(doc.nodes[0]!.x).toBe(0);
    expect(doc.title).toBe('采购申请');
    expect(history.redoLabel).toBe('移动节点');
    history.undo();
    expect(doc.title).toBe('采购');
    expect(history.canUndo).toBe(false);
    history.undo();
    expect(doc.title).toBe('采购');

    history.redo();
    history.redo();
    expect(doc).toEqual({ title: '采购申请', nodes: [{ id: 'a', x: 40 }] });
    expect(history.canRedo).toBe(false);
  });

  it('记下的是拷贝：之后改状态不影响历史，写回的也是新的拷贝', () => {
    const { doc, history } = setup();
    doc.nodes[0]!.x = 10;
    history.commit();
    doc.nodes[0]!.x = 20;
    history.undo();
    expect(doc.nodes[0]!.x).toBe(0);
    doc.nodes[0]!.x = 99;
    history.redo();
    expect(doc.nodes[0]!.x).toBe(10);
    history.undo();
    expect(doc.nodes[0]!.x).toBe(0);
  });

  it('与上一步相同的提交不记；撤销后提交别的改动丢掉可以重做的步骤', () => {
    const { doc, history } = setup();
    history.commit('没改');
    expect(history.canUndo).toBe(false);
    doc.title = 'A';
    history.commit('A');
    doc.title = 'B';
    history.commit('B');
    history.undo();
    expect(history.canRedo).toBe(true);
    history.commit('还是 A');
    expect(history.canRedo).toBe(true);
    doc.title = 'C';
    history.commit('C');
    expect(history.canRedo).toBe(false);
    history.undo();
    expect(doc.title).toBe('A');
  });

  it('同一个 merge 键在 mergeWindow 以内的提交合成一步，标签取第一次的；键不同或隔得久另起一步', () => {
    const { doc, history } = setup();
    for (const title of ['采', '采购', '采购单']) {
      doc.title = title;
      history.commit('改名称', { merge: 'title' });
      vi.advanceTimersByTime(200);
    }
    vi.advanceTimersByTime(600);
    doc.title = '采购单据';
    history.commit('改名称', { merge: 'title' });
    doc.nodes[0]!.x = 5;
    history.commit('移动', { merge: 'x:a' });

    history.undo();
    expect(doc.title).toBe('采购单据');
    history.undo();
    expect(doc.title).toBe('采购单');
    history.undo();
    expect(doc.title).toBe('采购');
    expect(history.canUndo).toBe(false);
  });

  it('不并进保存点：保存后接着输入，撤销能回到保存时的样子', () => {
    const { doc, history } = setup();
    doc.title = '甲';
    history.commit('改名称', { merge: 'title' });
    history.markSaved();
    doc.title = '甲乙';
    history.commit('改名称', { merge: 'title' });
    expect(history.dirty).toBe(true);
    history.undo();
    expect(doc.title).toBe('甲');
    expect(history.dirty).toBe(false);
  });

  it('连续的操作：期间的提交不起作用，end 记一步；cancel 回到开始前、不记', () => {
    const { doc, history } = setup();
    const drag = history.begin('移动节点');
    expect(history.busy).toBe(true);
    doc.nodes[0]!.x = 10;
    history.commit('中途');
    doc.nodes[0]!.x = 30;
    drag.end();
    expect(history.busy).toBe(false);
    expect(history.undoLabel).toBe('移动节点');
    history.undo();
    expect(doc.nodes[0]!.x).toBe(0);
    history.redo();

    const again = history.begin('移动节点');
    doc.nodes[0]!.x = 80;
    again.cancel();
    expect(doc.nodes[0]!.x).toBe(30);
    again.end();
    expect(history.undoLabel).toBe('移动节点');
    history.undo();
    expect(doc.nodes[0]!.x).toBe(0);
  });

  it('新的 begin 先结束进行中的操作；撤销会顶掉进行中的操作，之后它的 end 不起作用', () => {
    const { doc, history } = setup();
    const first = history.begin('拖 a');
    doc.nodes[0]!.x = 10;
    const second = history.begin('拖 a 又一次');
    doc.nodes[0]!.x = 20;
    second.end();
    first.end();
    history.undo();
    expect(doc.nodes[0]!.x).toBe(10);

    const third = history.begin('拖');
    doc.nodes[0]!.x = 50;
    history.undo();
    third.end();
    expect(doc.nodes[0]!.x).toBe(0);
    expect(history.canUndo).toBe(false);
  });

  it('保存点：markSaved 之后 dirty 为 false，改动后为 true，撤销回保存点又是 false；reset 清空历史', () => {
    const { doc, history } = setup();
    expect(history.dirty).toBe(false);
    doc.title = 'A';
    history.commit();
    expect(history.dirty).toBe(true);
    history.markSaved();
    expect(history.dirty).toBe(false);
    doc.title = 'B';
    history.commit();
    expect(history.dirty).toBe(true);
    history.undo();
    expect(history.dirty).toBe(false);
    history.undo();
    expect(history.dirty).toBe(true);

    history.reset();
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
    expect(history.dirty).toBe(false);
  });

  it('超过 limit 丢掉最早的步骤；保存点被丢掉后一直算有改动', () => {
    const { doc, history } = setup({ limit: 2 });
    for (const title of ['A', 'B', 'C']) {
      doc.title = title;
      history.commit(title);
    }
    history.undo();
    history.undo();
    expect(doc.title).toBe('A');
    expect(history.canUndo).toBe(false);
    expect(history.dirty).toBe(true);
  });

  it('canUndo、dirty 等是响应式的：计算属性随提交、撤销更新', () => {
    const { doc, history } = setup();
    const state = computed(() => `${history.canUndo}/${history.canRedo}/${history.dirty}`);
    expect(state.value).toBe('false/false/false');
    doc.title = 'A';
    history.commit();
    expect(state.value).toBe('true/false/true');
    history.undo();
    expect(state.value).toBe('false/true/false');
  });

  it('clone 为恒等时只存引用：按不可变方式更新的状态不复制', () => {
    let doc: Doc = { title: 'A', nodes: [] };
    const history = createHistory<Doc>({
      read: () => doc,
      write: (value) => (doc = value),
      clone: (value) => value,
    });
    const first = doc;
    doc = { ...doc, title: 'B' };
    history.commit();
    history.undo();
    expect(doc).toBe(first);
  });
});
