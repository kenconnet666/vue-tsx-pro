/**
 * 测试工具：在 Node 里把组件当成一个小程序页面挂上，按小程序的路径规则应用 setData，
 * 断言页面数据（模板看到的东西）与行内样式，模拟点击与按压。组件库的小程序渲染测试用它，不需要开发者工具。
 *
 *   const page = mountPage(Demo);
 *   await page.settle();
 *   page.tap(page.find((node) => node.v === '保存')!);
 *   expect(page.text()).toContain('已保存');
 */
import type { Component } from 'vue';
import { nextTick } from 'vue';
import { pageOptions } from './page.ts';

/** 页面数据里的一个节点（模板看到的字段） */
export interface PageNode {
  /** 编号 */
  s: string;
  /** 模板类型 */
  t: string;
  /** 文字（文本节点） */
  v?: string;
  /** 类名 */
  c?: string;
  /** 行内样式 */
  st?: string;
  /** 子节点 */
  cn?: PageNode[];
  [field: string]: unknown;
}

type Data = Record<string, unknown>;

/** 按小程序的规则应用 setData：键是 a.b[0].c 这样的路径，中间缺的对象、数组自动补上 */
export function applySetData(target: Data, payload: Data) {
  for (const [path, value] of Object.entries(payload)) {
    const keys = path.match(/[^.[\]]+/g)!;
    let current: Record<string, unknown> = target;
    keys.slice(0, -1).forEach((key, index) => {
      if (current[key] === undefined || current[key] === null)
        current[key] = /^\d+$/.test(keys[index + 1]!) ? [] : {};
      current = current[key] as Record<string, unknown>;
    });
    current[keys.at(-1)!] = structuredClone(value);
  }
}

/** 挂上的页面 */
export interface MountedPage {
  /** 页面数据 */
  readonly data: { root: { cn: PageNode[] } };
  /** 等 Vue 的更新与 setData 都完成 */
  settle(): Promise<void>;
  /** 按深度优先找第一个满足条件的节点 */
  find(predicate: (node: PageNode) => boolean): PageNode | undefined;
  /** 页面上的全部文字 */
  text(): string;
  /** 点一下（touchstart → touchend → tap，与真机的顺序一致），等更新完成 */
  tap(node: PageNode): Promise<void>;
  /** 派发一个原生事件（input、scroll…），detail 是小程序事件的 detail */
  dispatch(node: PageNode, type: string, detail?: unknown): Promise<void>;
  /** 卸载 */
  unmount(): void;
}

/** 把组件挂成一个页面 */
export function mountPage(component: Component, query: Record<string, string> = {}): MountedPage {
  const options = pageOptions(component);
  const page = {
    data: structuredClone(options.data) as { root: { cn: PageNode[] } },
    setData(payload: Data, callback?: () => void) {
      applySetData(page.data as unknown as Data, payload);
      callback?.();
    },
  };
  options.onLoad.call(page, query);
  const settle = async () => {
    // Vue 的更新、页面的合并、可能连带的第二轮（按压样式）各一个微任务
    for (let round = 0; round < 3; round++) {
      await nextTick();
      await Promise.resolve();
    }
  };
  const all = (nodes: PageNode[] = page.data.root.cn): PageNode[] =>
    nodes.flatMap((node) => [node, ...all(node.cn ?? [])]);
  const dispatch = async (node: PageNode, type: string, detail?: unknown) => {
    options.eh.call(page, { type, detail, currentTarget: { dataset: { s: node.s } } });
    await settle();
  };
  return {
    data: page.data,
    settle,
    find: (predicate) => all().find(predicate),
    text: () =>
      all()
        .map((node) => node.v ?? '')
        .join(''),
    async tap(node) {
      await dispatch(node, 'touchstart');
      await dispatch(node, 'touchend');
      await dispatch(node, 'tap');
    },
    dispatch,
    unmount: () => options.onUnload.call(page),
  };
}
