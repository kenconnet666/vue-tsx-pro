/**
 * 页面顶部的加载条：路由切换、整页刷新数据时，窗口最上方一条细线从左往右走（同 NProgress、GitHub 的顶部进度）。
 * 控制器 + 显示（同 Toast），组件内外都能用：
 *
 *   export const loadingBar = createLoadingBar();       // 应用里创建一次
 *   <LoadingBar controller={loadingBar} />               // App 里放一个
 *   loadingBar.start(); await load(); loadingBar.finish();   // 或 useRouteLoadingBar(router, loadingBar)
 *
 * 不知道真实进度：start 后先快后慢地涨，停在 90% 前等 finish；finish 走满后淡出，error 变成危险色走满后淡出。
 * 很快完成的（200ms 内）不显示，免得每次切换都闪一下。加载条只是视觉提示：对读屏是 role="progressbar"
 * 加 aria-busy，真正的“加载中”应当由页面内容区域（aria-busy、骨架）告诉读屏。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { shallowReactive } from 'vue';
import { useLang } from '../config/context';
import { mergeAttrs, type PartProps } from '../utils/props';
import { t } from '../config/theme/tokens';

/** 加载条的状态 */
export interface LoadingBarState {
  /** 进度，0–100 */
  readonly progress: number;
  /** 是否显示（开始一会儿之后、结束淡出之前） */
  readonly visible: boolean;
  /** 出错了：危险色 */
  readonly failed: boolean;
}

/** 加载条的控制器 */
export interface LoadingBarController extends LoadingBarState {
  /** 开始（已经在走时重新开始计时） */
  start(): void;
  /** 完成：走满后淡出 */
  finish(): void;
  /** 出错：变成危险色、走满后淡出 */
  error(): void;
}

/** createLoadingBar 的选项 */
export interface LoadingBarOptions {
  /** 多久之后才显示（毫秒），默认 200：很快完成的不显示 */
  delay?: number;
}

/** 每次涨多少：离 90% 越近涨得越慢 */
const trickle = (progress: number) => (90 - progress) * 0.12 + 0.5;

/** 创建加载条的控制器 */
export function createLoadingBar({ delay = 200 }: LoadingBarOptions = {}): LoadingBarController {
  const state = shallowReactive({ progress: 0, visible: false, failed: false });
  let timer: ReturnType<typeof setInterval> | undefined;
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  function stop() {
    clearInterval(timer);
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
  }

  function end(failed: boolean) {
    stop();
    if (!state.visible) {
      state.progress = 0;
      return;
    }
    state.failed = failed;
    state.progress = 100;
    // 走满的过渡结束后淡出，淡出后归零
    hideTimer = setTimeout(() => {
      state.visible = false;
      hideTimer = setTimeout(() => (state.progress = 0), 300);
    }, 300);
  }

  return {
    get progress() {
      return state.progress;
    },
    get visible() {
      return state.visible;
    },
    get failed() {
      return state.failed;
    },
    start() {
      stop();
      state.failed = false;
      state.progress = state.visible ? state.progress : 0;
      showTimer = setTimeout(() => {
        state.visible = true;
        state.progress = Math.max(state.progress, 8);
      }, delay);
      timer = setInterval(() => {
        if (state.visible) state.progress = Math.min(state.progress + trickle(state.progress), 90);
      }, 300);
    },
    finish: () => end(false),
    error: () => end(true),
  };
}

/** 未声明的属性落到加载条的 div 上 */
export interface LoadingBarProps extends PartProps<'div', 'role'> {
  /** createLoadingBar 的控制器 */
  controller: LoadingBarController;
}

/** LoadingBar 的样式：root、visible、bar、failed */
export const loadingBarStyles = stylex.create({
  root: {
    position: 'fixed',
    insetInline: 0,
    insetBlockStart: 0,
    zIndex: 2000,
    height: '_borderWidths.md',
    pointerEvents: 'none',
    opacity: 0,
    transition: `opacity ${t.durations.md} ${t.easings.standard}`,
  },
  visible: { opacity: 1 },
  bar: {
    height: '100%',
    backgroundColor: { default: '_accent', '@media (forced-colors: active)': 'Highlight' },
    boxShadow: `0 0 8px ${t.colors.accent}`,
    transformOrigin: { default: 'left center', ':dir(rtl)': 'right center' },
    transition: `transform ${t.durations.md} ${t.easings.standard}`,
  },
  failed: { backgroundColor: '_danger', boxShadow: 'none' },
});

/** 进度对应的缩放 */
export const loadingBarScaleStyles = stylex.create({
  at: (progress: number) => ({ transform: `scaleX(${progress / 100})` }),
});

/** 加载条：显示控制器的进度 */
export const LoadingBar = _component(({ controller, ...rest }: LoadingBarProps) => {
  const lang = useLang();
  return () => (
    <div
      {...mergeAttrs<'div'>(
        {
          sx: [loadingBarStyles.root, controller.visible && loadingBarStyles.visible],
          'aria-label': lang.loading,
        },
        rest,
        {
          role: 'progressbar',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.round(controller.progress),
          'aria-busy': controller.visible && controller.progress < 100,
          'aria-hidden': controller.visible ? undefined : true,
        },
      )}
      data-state={controller.failed ? 'error' : controller.visible ? 'loading' : 'idle'}
    >
      <div
        {...stylex.attrs(
          loadingBarStyles.bar,
          controller.failed && loadingBarStyles.failed,
          loadingBarScaleStyles.at(controller.progress),
        )}
      />
    </div>
  );
});
