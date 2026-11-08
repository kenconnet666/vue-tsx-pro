/**
 * 流程工程的视图（views/*.tsx，packages/flow/docs/decisions/0002 第 4 节）：从引擎取编好的模块，用引擎的链接器加载，
 * 页面登记的宿主模块是 vue、编译器的运行时与组件库——和页面本身同一份模块，主题、数据来源这些 Provider 都管得到。
 * start.tsx 是发起页的分区，print.tsx 是打印页，别的按文件名排成审批单的分区；`export const title` 是分区的标题。
 * 写错了的视图不拖垮审批单：加载或渲染出错时那一块写出错误。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { linkProject, type FlowClient, type HostModules } from '@zerodep-dev/flow-ts-engine/client';
import { isViewFile, type FlowViewProps } from '@zerodep-dev/flow-ts-model';
import { Alert, Card } from '@zerodep-dev/vue-tsx-pro-ui';
import { h, onErrorCaptured, type Component } from 'vue';

const HOST: HostModules = {
  vue: { load: () => import('vue') },
  '@zerodep-dev/vue-tsx-pro-tsx': { load: () => import('@zerodep-dev/vue-tsx-pro-tsx') },
  '@zerodep-dev/vue-tsx-pro-tsx/styles': {
    load: () => import('@zerodep-dev/vue-tsx-pro-tsx/styles'),
  },
  '@zerodep-dev/vue-tsx-pro-ui': { load: () => import('@zerodep-dev/vue-tsx-pro-ui') },
  '@lucide/icons': { load: () => import('@lucide/icons') },
};

export interface ProcessView {
  readonly path: string;
  readonly title: string;
  readonly component: Component<FlowViewProps>;
}

export interface ProcessViews {
  /** 审批单的分区 */
  readonly sections: readonly ProcessView[];
  /** 发起页的分区 */
  readonly start?: ProcessView;
  /** 打印页 */
  readonly print?: ProcessView;
}

const NONE: ProcessViews = { sections: [] };

/** 发布了的版本不会变：按流程与版本缓存 */
const cache = new Map<string, Promise<ProcessViews>>();

/** 一个流程某一版的视图；不写版本是最新的一版（发起页用，不缓存：可能刚发布了新版） */
export function processViews(
  client: FlowClient,
  key: string,
  version?: number,
): Promise<ProcessViews> {
  if (version === undefined) return load(client, key);
  const id = `${key}@${version}`;
  let found = cache.get(id);
  if (!found) {
    found = load(client, key, version);
    cache.set(id, found);
    found.catch(() => cache.delete(id));
  }
  return found;
}

async function load(client: FlowClient, key: string, version?: number): Promise<ProcessViews> {
  const modules = await client.views(key, version);
  const paths = Object.keys(modules).filter(isViewFile).sort();
  if (paths.length === 0) return NONE;
  const linked = await linkProject(modules, HOST);
  const views = paths.map((path): ProcessView => {
    const exports = linked.module(path);
    const name = path.slice('views/'.length).replace(/\.tsx?$/, '');
    return {
      path,
      title: typeof exports['title'] === 'string' ? exports['title'] : name,
      component: exports['default'] as Component<FlowViewProps>,
    };
  });
  const named = (name: string) => views.find((v) => v.path === `views/${name}.tsx`);
  const special = [named('start'), named('print')];
  return {
    sections: views.filter((v) => !special.includes(v)),
    ...(special[0] ? { start: special[0] } : {}),
    ...(special[1] ? { print: special[1] } : {}),
  };
}

/**
 * 打印一块已经渲染好的内容：抄进一个看不见的 iframe（连同页面的样式，按浅色主题）再打印，打完移除；
 * 页面上别的东西不进打印，也不用给整页写打印样式
 */
export function printElement(element: HTMLElement): void {
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position: fixed; width: 0; height: 0; border: 0; visibility: hidden';
  document.body.append(frame);
  const styles = [...document.querySelectorAll('style, link[rel="stylesheet"]')]
    .map((node) => node.outerHTML)
    .join('');
  const page = frame.contentDocument!;
  page.open();
  page.write(
    `<!doctype html><html lang="zh-CN" data-theme="light"><head><meta charset="utf-8">${styles}</head>` +
      `<body style="padding: 16px">${element.outerHTML}</body></html>`,
  );
  page.close();
  const view = frame.contentWindow!;
  view.addEventListener('afterprint', () => frame.remove());
  // 样式表要加载一下
  setTimeout(() => view.print(), 200);
}

/** 一个视图放进卡片：标题是视图的 title；渲染出错时写出错误，不往上抛 */
export const ViewSection = _component(
  ({ view, props, bare = false }: { view: ProcessView; props: FlowViewProps; bare?: boolean }) => {
    let failed = _state('');
    onErrorCaptured((error) => {
      failed = error instanceof Error ? error.message : String(error);
      return false;
    });
    return () => {
      const body = failed ? (
        <Alert tone="danger" title={`${view.path} 出错了`} description={failed} />
      ) : (
        h(view.component, props)
      );
      return bare ? (
        body
      ) : (
        <Card padding="lg" header={view.title}>
          {body}
        </Card>
      );
    };
  },
);
