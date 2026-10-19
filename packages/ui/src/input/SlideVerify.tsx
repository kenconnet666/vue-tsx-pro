/**
 * 拖动验证：把滑块拖到头（或拖到拼图缺口处）完成验证，常见于登录、发送验证码前的人机验证。
 *
 *   <SlideVerify status={status} onRelease={(result) => verify(result)} />
 *   <SlideVerify target="free" position={_bind(offset)} status={status} onRelease={verify} />  拼图
 *
 * 组件只负责交互，判定交给服务端：前端的滑块本身挡不住脚本，松手时交出的位置与拖动轨迹
 * （时间、位置序列）要发给服务端校验；拼图的图片与缺口位置也由服务端生成，应用按 position 画出拼图块。
 * 状态由应用控制：松手后设为 verifying，服务端返回后设为 success 或 error；设回 idle 时滑块回到起点。
 *
 * 无障碍：滑块是 role="slider"，键盘用 ←/→ 移动、Home/End 到两端、Enter 或空格松手（WCAG 2.5.7 的替代操作）；
 * 状态变化经 aria-live 播报。即便如此，这类验证对读屏与运动障碍用户仍不友好，应用应另外提供其他验证方式。
 */
import { Check, ChevronsRight, X } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { watch, type VNodeChild } from 'vue';
import { Icon, type IconProps } from '../base/Icon';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import type { JSAnimation } from 'animejs';
import { useAnimate } from '../utils/animation';
import { startMove } from '../utils/dom/move';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { focusRingStyles, type StyleTable } from '../utils/style/styles';
import { clamp, isRtl } from '../utils/data/layout';

/** 验证状态，由应用控制 */
export interface SlideVerifyStatuses {
  /** 等待拖动（默认）；从其他状态设回 idle 时滑块回到起点 */
  idle: unknown;
  /** 已松手，等待服务端判定：不能再拖 */
  verifying: unknown;
  /** 通过：滑块停在原处并锁定 */
  success: unknown;
  /** 没通过：显示错误，设回 idle（通常同时换一张拼图）后重试 */
  error: unknown;
}

/** 拖到哪里算完成 */
export interface SlideVerifyTargets {
  /** 拖到最右端（默认）：没拖到头就松手时弹回起点，不触发 onRelease */
  end: unknown;
  /** 任意位置松手都触发 onRelease，由服务端判断位置对不对（拼图验证） */
  free: unknown;
}

/** 拖动轨迹上的一个点 */
export interface SlideVerifyPoint {
  /** 距开始拖动的毫秒数 */
  readonly t: number;
  /** 位置，0 为起点、1 为终点 */
  readonly position: number;
}

/** 松手时交给应用（再发给服务端）的结果 */
export interface SlideVerifyResult {
  /** 松手位置，0–1 */
  readonly position: number;
  /** 拖动轨迹：人手拖动有加减速与抖动，服务端据此区分脚本 */
  readonly trail: readonly SlideVerifyPoint[];
  /** 从按下到松手的毫秒数 */
  readonly duration: number;
}

/** 未声明的属性落到外层（轨道）上 */
export interface SlideVerifyProps extends PartProps<'div'> {
  /** 验证状态，默认 idle */
  status?: keyof SlideVerifyStatuses;
  /** 拖到哪里算完成，默认 end */
  target?: keyof SlideVerifyTargets;
  /** 当前位置（0–1）：拼图验证时父级写 position={_bind(x)}，按它移动拼图块 */
  position?: number;
  /** 松手（键盘为 Enter）：把结果发给服务端校验 */
  onRelease?: (result: SlideVerifyResult) => void;
  /** 不可用 */
  disabled?: boolean;
  /** 轨道上的提示文字，默认取语言包的 slideVerifyHint */
  hint?: VNodeChild;
  /** 已拖过部分（着色的那一段）的部件属性 */
  propsFill?: PartProps<'div'>;
  /** 提示文字的部件属性 */
  propsHint?: PartProps<'span'>;
  /** 滑块（role="slider"）的部件属性；aria-label 默认取语言包，可以在这里改 */
  propsHandle?: PartProps<
    'div',
    | 'role'
    | 'tabindex'
    | 'aria-valuemin'
    | 'aria-valuemax'
    | 'aria-valuenow'
    | 'aria-valuetext'
    | 'aria-disabled'
  >;
  /** 滑块上图标的部件属性 */
  propsIcon?: Partial<IconProps>;
}

/** target="end" 时拖到多远算到头（留一点余量，不必像素级对齐） */
const END = 0.98;
/** 键盘每次移动的距离 */
const KEY_STEP = 0.05;

/** SlideVerify 的样式：root、disabled、fill、hint、handle、settle 等 */
export const slideVerifyStyles: StyleTable<
  'root' | 'disabled' | 'fill' | 'hint' | 'handle' | 'settle' | 'locked' | 'success' | 'error'
> = stylex.create({
  root: {
    position: 'relative',
    boxSizing: 'border-box',
    height: 'max(_sizes.control, _sizes.minTarget)',
    overflow: 'hidden',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    backgroundColor: '_fill',
    userSelect: 'none',
  },
  disabled: { opacity: '_disabled' },
  // 已拖过的部分；宽度与滑块位置都由 CSS 变量 --slide-verify-position（0–1）算出
  fill: {
    position: 'absolute',
    insetBlock: 0,
    insetInlineStart: 0,
    width:
      'calc(var(--slide-verify-position) * (100% - max(_sizes.control, _sizes.minTarget)) + max(_sizes.control, _sizes.minTarget))',
    backgroundColor: '_accentSoft',
  },
  hint: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: 'max(_sizes.control, _sizes.minTarget)',
    color: '_textMuted',
    fontSize: '_sm',
    pointerEvents: 'none',
  },
  handle: {
    position: 'absolute',
    insetBlock: 0,
    insetInlineStart:
      'calc(var(--slide-verify-position) * (100% - max(_sizes.control, _sizes.minTarget)))',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'max(_sizes.control, _sizes.minTarget)',
    borderRadius: '_md',
    backgroundColor: '_surface',
    boxShadow: '_sm',
    color: '_accentText',
    touchAction: 'none',
    cursor: 'grab',
    outlineOffset: 'calc(-1 * _borderWidths.sm)',
  },
  // 键盘移动时位置变化有过渡；拖动中跟手、弹簧弹回时由 Anime.js 逐帧写位置，都不加过渡
  settle: {
    transition:
      'inset-inline-start _durations.md _easings.standard, width _durations.md _easings.standard',
  },
  locked: { cursor: 'default' },
  success: { backgroundColor: '_successSoft', color: '_successText' },
  error: { backgroundColor: '_dangerSoft', color: '_dangerText' },
});

/** 拖动验证条：拖到头或拼图缺口处松手，结果交给服务端判定 */
export const SlideVerify = _component(
  ({
    status = 'idle',
    target = 'end',
    position = _bindable(0),
    onRelease,
    disabled = false,
    hint,
    propsFill,
    propsHint,
    propsHandle,
    propsIcon,
    ...rest
  }: SlideVerifyProps) => {
    const lang = useLang();
    let root = _state.raw<HTMLElement | null>(null);
    let handle = _state.raw<HTMLElement | null>(null);
    let dragging = _state(false);
    // 松手没到位、取消、重试时用弹簧回到起点：Anime.js 逐帧写 position
    let springing = _state(false);
    let spring: JSAnimation | undefined;
    const animate = useAnimate();

    function returnHome() {
      spring?.cancel();
      if (position === 0) return;
      const motion = { position };
      springing = true;
      spring = animate(
        motion,
        { position: 0, onUpdate: () => (position = motion.position) },
        { bounce: 0.25 },
      );
      void spring.then(() => {
        position = 0;
        springing = false;
      });
    }
    let trail: SlideVerifyPoint[] = [];
    let startedAt = 0;

    const interactive = () => status === 'idle' && !disabled;
    const toRange = (value: number) => clamp(value, 0, 1);
    const rtl = () => !!root && isRtl(root);

    function record() {
      if (!trail.length) startedAt = performance.now();
      trail.push({ t: Math.round(performance.now() - startedAt), position });
    }

    function release() {
      if (target === 'end' && position < END) {
        returnHome();
        trail = [];
        return;
      }
      if (target === 'end') position = 1;
      const result = { position, trail, duration: Math.round(performance.now() - startedAt) };
      trail = [];
      onRelease?.(result);
    }

    function grab(event: PointerEvent) {
      if (!interactive() || !root || !handle) return;
      event.preventDefault();
      handle.focus();
      const travel = root.clientWidth - handle.offsetWidth;
      const direction = rtl() ? -1 : 1;
      spring?.cancel();
      springing = false;
      const start = position;
      trail = [];
      record();
      dragging = true;
      startMove(event, {
        onMove: ({ deltaX }) => {
          position = toRange(start + (direction * deltaX) / travel);
          record();
        },
        onEnd: ({ cancelled }) => {
          dragging = false;
          if (cancelled) {
            returnHome();
            trail = [];
          } else release();
        },
      });
    }

    function onKeydown(event: KeyboardEvent) {
      if (!interactive()) return;
      const forward = rtl() ? 'ArrowLeft' : 'ArrowRight';
      const backward = rtl() ? 'ArrowRight' : 'ArrowLeft';
      const moves: Record<string, () => number> = {
        [forward]: () => toRange(position + KEY_STEP),
        [backward]: () => toRange(position - KEY_STEP),
        Home: () => 0,
        End: () => 1,
      };
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (trail.length) release();
        return;
      }
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      position = move();
      record();
    }

    // 应用把状态设回 idle（重试、换拼图）：滑块弹回起点；验证失败时滑块左右轻晃一下
    watch(
      () => status,
      (next) => {
        if (next === 'idle') returnHome();
        if (next === 'error' && handle)
          animate(handle, { x: [0, -6, 6, -4, 4, 0] }, { duration: 'lg' });
      },
    );

    return () => {
      const locked = !interactive();
      const text = {
        idle: hint ?? lang.slideVerifyHint,
        verifying: lang.slideVerifyChecking,
        success: lang.slideVerifySuccess,
        error: lang.slideVerifyError,
      }[status];
      const icon = status === 'success' ? Check : status === 'error' ? X : ChevronsRight;
      return (
        <div
          {...elementProps(
            mergeProps<'div'>({ sx: slideVerifyStyles.root }, rest, {
              sx: disabled && slideVerifyStyles.disabled,
              ref: _toRef(root),
              style: { '--slide-verify-position': String(position) },
              'aria-busy': status === 'verifying' || undefined,
            }),
          )}
          data-status={status}
        >
          <div
            {...elementProps(
              mergeProps<'div'>({ sx: slideVerifyStyles.fill }, propsFill, {
                sx: [
                  !dragging && !springing && slideVerifyStyles.settle,
                  status === 'success' && slideVerifyStyles.success,
                  status === 'error' && slideVerifyStyles.error,
                ],
              }),
            )}
          />
          <span
            {...elementProps(
              mergeProps<'span'>({ sx: slideVerifyStyles.hint }, propsHint, {
                'aria-hidden': true,
              }),
            )}
          >
            {position === 0 || status !== 'idle' ? text : null}
          </span>
          <div
            {...elementProps(
              mergeProps<'div'>(
                {
                  // 焦点环在前：滑块自己的 outlineOffset（画在里面，外层会裁掉外面）覆盖它
                  sx: [focusRingStyles.visible, slideVerifyStyles.handle],
                  'aria-label': lang.slideVerifyHint,
                },
                propsHandle,
                {
                  sx: [
                    !dragging && !springing && slideVerifyStyles.settle,
                    locked && slideVerifyStyles.locked,
                    status === 'success' && slideVerifyStyles.success,
                    status === 'error' && slideVerifyStyles.error,
                  ],
                  ref: _toRef(handle),
                  role: 'slider',
                  tabindex: disabled ? undefined : 0,
                  'aria-valuemin': 0,
                  'aria-valuemax': 100,
                  'aria-valuenow': Math.round(position * 100),
                  'aria-valuetext': `${Math.round(position * 100)}%`,
                  'aria-disabled': locked || undefined,
                  onPointerdown: grab,
                  onKeydown,
                },
              ),
            )}
          >
            <Icon
              {...mergePartProps<IconProps>({ icon, flipInRtl: icon === ChevronsRight }, propsIcon)}
            />
          </div>
          <VisuallyHidden aria-live="polite">{status === 'idle' ? '' : text}</VisuallyHidden>
        </div>
      );
    };
  },
);
