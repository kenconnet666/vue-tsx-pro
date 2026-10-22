/**
 * 滚动高亮（scroll spy）：页面滚到哪一节，就报告哪一节的 id。TableOfContents 用它高亮当前小节。
 *
 *   const current = useScrollSpy(() => ({ ids: headings.map((heading) => heading.id) }));
 *
 * 当前节 = 顶部已经越过阅读线的最后一个元素；阅读线是元素自己的 scroll-margin-top（标题让开粘性顶栏的距离，
 * 见 layoutVars.stickyOffset），所以点目录跳过去之后，高亮的正好是跳到的那一节。
 * 滚到底时最后几节可能永远到不了阅读线：这时高亮视口里的最后一个。
 */
import { onMounted, onScopeDispose, shallowRef, watch, type Ref } from 'vue';
import { useEventListener } from './event-listener';

/** useScrollSpy 每次读取的选项 */
export interface ScrollSpyOptions {
  /** 要追踪的元素的 id，按文档顺序 */
  ids: readonly string[];
  /** 滚动容器；不写时是页面（窗口） */
  root?: HTMLElement | null;
}

/** 当前节的 id（在 setup 里调用）；还没滚到第一节时为 undefined */
export function useScrollSpy(read: () => ScrollSpyOptions): Readonly<Ref<string | undefined>> {
  const current = shallowRef<string | undefined>();
  if (typeof window === 'undefined') return current;

  function update() {
    const { ids, root } = read();
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    const top = root ? root.getBoundingClientRect().top : 0;
    const scroller = root ?? document.scrollingElement ?? document.documentElement;
    const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
    const bottom = root ? root.getBoundingClientRect().bottom : window.innerHeight;
    let next: string | undefined;
    for (const element of elements) {
      const offset = element.getBoundingClientRect().top - top;
      const line = parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
      // +1：跳转后元素正好停在阅读线上，取整误差不该让它算作还没到
      if (offset <= line + 1 || (atBottom && offset < bottom - top)) next = element.id;
    }
    current.value = next;
  }

  // 一帧最多量一次
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  };
  // 滚动容器常常在挂载后才拿到（ref 回调）：换了容器就换绑，并按新容器重新算，不能留着按窗口算的结果
  useEventListener(() => read().root ?? window, 'scroll', schedule, { passive: true });
  useEventListener(window, 'resize', schedule);
  onMounted(update);
  watch(() => read().root, schedule);
  watch(() => read().ids, schedule, { flush: 'post' });
  onScopeDispose(() => cancelAnimationFrame(frame));
  return current;
}

/** 目录里的一项 */
export interface HeadingEntry {
  /** 标题的 id（锚点） */
  id: string;
  /** 标题文字 */
  label: string;
  /** 标题级别：2 是 h2，3 是 h3… */
  level: number;
}

/** 收集容器里带 id 的标题，生成目录（页面渲染后调用）；默认收集 h2、h3 */
export function collectHeadings(
  container: ParentNode,
  selector = 'h2[id], h3[id]',
): HeadingEntry[] {
  return [...container.querySelectorAll<HTMLElement>(selector)].map((heading) => ({
    id: heading.id,
    label: heading.textContent?.trim() ?? '',
    level: Number(heading.tagName.slice(1)) || 2,
  }));
}
