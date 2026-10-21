/**
 * 读屏播报（参考 React Aria 的 LiveAnnouncer）：整页共用两个常驻的 aria-live 区域（polite 与 assertive），
 * 组件不再各自挂播报区。读屏只念已经存在的区域里的变化，随内容一起插入的 aria-live 区域常常不念，第一句就丢了。
 *
 *   announce(lang.tableSelectedCount(3));
 *   announce('保存失败', 'assertive');
 *
 * 有模态对话框打开时区域挂进最上层的对话框：showModal 让对话框外面的内容对读屏失效。
 */
import { topModal } from './overlay';

/** 播报的紧迫程度 */
export interface Politenesses {
  /** 等读屏念完当前的内容再念（默认）：选中条数、搜索结果、已复制 */
  polite: unknown;
  /** 打断当前的朗读：出错、操作失败 */
  assertive: unknown;
}

/** 播报的紧迫程度 */
export type Politeness = keyof Politenesses;

/** 只给读屏的区域：视觉上隐藏（同 VisuallyHidden；这里是命令式创建的元素，直接写行内样式） */
const SR_ONLY: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: '0',
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: '0',
};

/** 清空与写入之间隔多久（毫秒）：同一帧里改两次，读屏只看到最后的结果，重复的话就不念了 */
const REPEAT_DELAY = 100;

const regions = new Map<Politeness, HTMLElement>();
const timers = new Map<Politeness, ReturnType<typeof setTimeout>>();

function region(politeness: Politeness): HTMLElement {
  let element = regions.get(politeness);
  if (!element) {
    element = document.createElement('div');
    element.setAttribute('aria-live', politeness);
    element.setAttribute('aria-atomic', 'true');
    element.dataset.liveAnnouncer = politeness;
    Object.assign(element.style, SR_ONLY);
    regions.set(politeness, element);
  }
  const host = topModal() ?? document.body;
  if (element.parentElement !== host) host.append(element);
  return element;
}

/** 让读屏念出一句话；同一句话连说两次也会念（先清空，稍后再写入）。没有 document（服务端）时什么也不做 */
export function announce(message: string, politeness: Politeness = 'polite'): void {
  if (typeof document === 'undefined' || !message) return;
  const element = region(politeness);
  element.textContent = '';
  clearTimeout(timers.get(politeness));
  timers.set(
    politeness,
    setTimeout(() => (element.textContent = message), REPEAT_DELAY),
  );
}
