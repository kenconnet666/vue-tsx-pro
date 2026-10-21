/**
 * 抽屉式侧栏（AppShell sidebarMode="overlay"）的开关与宽度：每个看的人自己记住（localStorage）。
 * 隐私模式、禁用存储时读写会抛错，只在这次打开有效。文档站与降本案例各用一个键。
 *
 *   const sidebar = sidebarPreference('docs.sidebar', { open: true, width: 256 });
 *   <AppShell sidebarMode="overlay" sidebarOpen={_bind(sidebar.open)} sidebarWidth={_bind(sidebar.width)} … />
 */
import { reactive, watch } from 'vue';

/** 侧栏的开关与宽度（px） */
export interface SidebarPreference {
  open: boolean;
  width: number;
}

function read(key: string): Partial<SidebarPreference> {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as Partial<SidebarPreference>;
    return {
      ...(typeof saved.open === 'boolean' && { open: saved.open }),
      ...(typeof saved.width === 'number' &&
        Number.isFinite(saved.width) && { width: saved.width }),
    };
  } catch {
    return {};
  }
}

/** 读出记住的开关与宽度（没有时用 defaults），之后改了就写回去 */
export function sidebarPreference(key: string, defaults: SidebarPreference): SidebarPreference {
  const state = reactive({ ...defaults, ...read(key) });
  watch(state, () => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // 存不了就只在这次有效
    }
  });
  return state;
}
