/**
 * 拼图滑块验证：画面是服务端生成的背景图（有一个缺口）和一块拼图，拖动下面的滑块让拼图对准缺口，松手后把位置和拖动轨迹
 * 交给服务端判定。组件只负责交互，不判对错：答案在服务端，每次给一张新图。
 *
 *   <SlideCaptcha
 *     challenge={challenge}      // 服务端给的图；还没拿到时为 null
 *     status={status}            // idle / verifying / success / error，由父级按判定结果设置
 *     onRelease={(result) => verify(challenge.id, result)}
 *     onRefresh={loadChallenge}
 *   />
 *
 * - `challenge`：background、piece 是图片地址（data URL 或普通地址），width、height 是背景图的像素尺寸，pieceWidth 是拼图图片的宽度；
 *   拼图图片和背景一样高，左边缘就是缺口的左边缘，所以位置换算成像素直接就是答案。
 * - `onRelease` 交出 { x, track, duration }：x 是拼图左边缘在背景图里的像素位置，track 是（毫秒，位置）序列，
 *   真人拖动有加减速和抖动，服务端据此区分脚本。
 * - `status` 由父级控制：verifying 时不能拖，success 时锁定，error 时滑块晃一下；父级换了新的 challenge 或设回 idle 时滑块回到起点。
 * - 键盘：聚焦滑块后 ←/→ 微调、Home/End、Enter 或空格松手。这类验证对读屏和运动障碍的用户不友好，应用应当另外提供别的方式。
 */
import { Check, ChevronsRight, RefreshCw, X } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { watch } from 'vue';
import { Icon } from '../base/Icon';
import { IconButton } from '../base/IconButton';
import { Spinner } from '../base/Spinner';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useMessages } from '../config/lang/messages';
import { mergeAttrs, type PartProps } from '../utils/props';
import { patternsMessages } from './messages';

/** 服务端给的一张拼图 */
export interface SlideChallenge {
  /** 这一张的标识，换图时变；松手后连同结果一起交给服务端 */
  id: string;
  /** 背景图（带缺口） */
  background: string;
  /** 拼图图片：和背景一样高，左边缘对着缺口的左边缘 */
  piece: string;
  /** 背景图的宽（px） */
  width: number;
  /** 背景图的高（px） */
  height: number;
  /** 拼图图片的宽度（px） */
  pieceWidth: number;
}

/** 松手时交给服务端的内容 */
export interface SlideResult {
  /** 拼图左边缘在背景图里的位置（px，整数） */
  x: number;
  /** 拖动轨迹：距按下的毫秒数，和当时的位置（px） */
  track: { t: number; x: number }[];
  /** 从按下到松手的毫秒数 */
  duration: number;
}

/** 验证码的状态：idle 可以拖，verifying 等服务端判定，success 通过，error 没对准 */
export type SlideStatus = 'idle' | 'verifying' | 'success' | 'error';

/** 未声明的属性落到外层 div 上 */
export interface SlideCaptchaProps extends PartProps<'div'> {
  /** 当前的拼图；还没拿到时为 null，显示加载中 */
  challenge: SlideChallenge | null;
  /** 状态，默认 idle */
  status?: SlideStatus;
  /** 滑块条上的提示，默认“向右拖动滑块，让拼图对准缺口” */
  hint?: string;
  /** 没对准时的提示（图片底部和滑块条上），默认“没对准，请再试一次”；服务端给了具体原因时用它 */
  errorText?: string;
  /** 松手：把结果发给服务端判定 */
  onRelease?: (result: SlideResult) => void;
  /** 点了“换一张” */
  onRefresh?: () => void;
}

/** 键盘每次移动的距离（px） */
const KEY_STEP = 2;
/** 轨迹最多记多少个点，太长的拖动只留一部分 */
const MAX_POINTS = 240;
/** 滑块的宽度，也是滑块条的高度 */
const HANDLE = '2.75rem';
/** 松手回到起点时的过渡：带一点回弹 */
const SETTLE = '0.28s cubic-bezier(0.34, 1.4, 0.64, 1)';

/** SlideCaptcha 的样式：root、picture、image、piece、banner、track、fill、handle 等 */
export const slideCaptchaStyles = css.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_sm',
    width: '_full',
    userSelect: 'none',
  },
  picture: {
    position: 'relative',
    boxSizing: 'border-box',
    width: '_full',
    overflow: 'hidden',
    borderRadius: '_md',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    backgroundColor: '_fill',
  },
  image: {
    display: 'block',
    width: '_full',
    height: '_full',
    objectFit: 'cover',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  piece: {
    position: 'absolute',
    top: 0,
    height: '_full',
    pointerEvents: 'none',
    filter: 'drop-shadow(0 2px 6px rgb(0 0 0 / 0.45))',
  },
  pieceSettle: { transition: `left ${SETTLE}` },
  refresh: { position: 'absolute', top: '_xs', insetInlineEnd: '_xs' },
  // 盖在图上的结果条：底色固定为深色半透明，白字在任何背景图上都读得清
  banner: {
    position: 'absolute',
    insetInline: 0,
    bottom: 0,
    paddingBlock: '_xs',
    paddingInline: '_md',
    fontSize: '_sm',
    textAlign: 'center',
    color: 'white',
  },
  bannerSuccess: { backgroundColor: 'rgb(22 163 74 / 0.88)' },
  bannerError: { backgroundColor: 'rgb(220 38 38 / 0.88)' },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '_sm',
    height: '_full',
    color: '_textMuted',
    fontSize: '_sm',
  },
  track: {
    position: 'relative',
    boxSizing: 'border-box',
    height: HANDLE,
    overflow: 'hidden',
    borderRadius: '_md',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    backgroundColor: '_fill',
  },
  fill: {
    position: 'absolute',
    insetBlock: 0,
    insetInlineStart: 0,
    backgroundColor: '_accentSoft',
  },
  fillSuccess: { backgroundColor: '_successSoft' },
  fillError: { backgroundColor: '_dangerSoft' },
  hint: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: HANDLE,
    color: '_textMuted',
    fontSize: '_sm',
    pointerEvents: 'none',
  },
  handle: {
    position: 'absolute',
    insetBlock: 0,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: HANDLE,
    borderRadius: '_md',
    backgroundColor: '_surface',
    boxShadow: '_sm',
    color: '_accentText',
    cursor: 'grab',
    touchAction: 'none',
    outlineOffset: '-2px',
  },
  handleActive: { cursor: 'grabbing', boxShadow: '_md' },
  handleSuccess: { color: '_successText' },
  handleError: { color: '_dangerText' },
  locked: { cursor: 'default' },
  // 松手后回到起点、或键盘微调时有过渡；拖动中跟手，不加过渡
  settle: { transition: `left ${SETTLE}, width ${SETTLE}` },
});

/** SlideCaptcha 的动态样式：位置用百分比，画面和滑块条按容器宽度缩放 */
export const slideCaptchaDynamicStyles = css.create({
  at: (percent: number) => ({ left: `${percent}%` }),
  pieceWidth: (percent: number) => ({ width: `${percent}%` }),
  ratio: (aspect: number) => ({ aspectRatio: String(aspect) }),
  // 滑块在条里的位置：条宽减去滑块宽的部分按比例走
  handleAt: (position: number) => ({ left: `calc(${position} * (100% - ${HANDLE}))` }),
  fillTo: (position: number) => ({ width: `calc(${position} * (100% - ${HANDLE}) + ${HANDLE})` }),
});

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** 拼图滑块验证：拖动滑块让拼图对准缺口，松手把位置与轨迹交给服务端判定 */
export const SlideCaptcha = _component(
  ({
    challenge,
    status = 'idle',
    hint,
    errorText,
    onRelease,
    onRefresh,
    ...rest
  }: SlideCaptchaProps) => {
    const messages = useMessages('patterns', patternsMessages);
    let trackElement = _state.raw<HTMLElement | null>(null);
    let handleElement = _state.raw<HTMLElement | null>(null);
    // 拼图左边缘的位置占“可移动距离”的比例（0 到 1）
    let position = _state(0);
    let dragging = _state(false);
    let track: SlideResult['track'] = [];
    let startedAt = 0;

    const travel = () => (challenge ? challenge.width - challenge.pieceWidth : 0);
    const pixels = () => Math.round(position * travel());
    const interactive = () => challenge !== null && status === 'idle';

    function record() {
      if (!track.length) startedAt = performance.now();
      if (track.length < MAX_POINTS) {
        track.push({ t: Math.round(performance.now() - startedAt), x: pixels() });
      }
    }

    function release() {
      if (!track.length) return;
      const result: SlideResult = {
        x: pixels(),
        track,
        duration: Math.round(performance.now() - startedAt),
      };
      track = [];
      onRelease?.(result);
    }

    function grab(event: PointerEvent) {
      if (!interactive() || !trackElement || !handleElement) return;
      event.preventDefault();
      handleElement.focus();
      handleElement.setPointerCapture(event.pointerId);
      const room = trackElement.clientWidth - handleElement.offsetWidth;
      const startX = event.clientX;
      const startPosition = position;
      track = [];
      record();
      dragging = true;
      const move = (next: PointerEvent) => {
        position = clamp01(startPosition + (next.clientX - startX) / Math.max(room, 1));
        record();
      };
      const end = (next: PointerEvent) => {
        handleElement?.removeEventListener('pointermove', move);
        handleElement?.removeEventListener('pointerup', end);
        handleElement?.removeEventListener('pointercancel', end);
        handleElement?.releasePointerCapture(next.pointerId);
        dragging = false;
        if (next.type === 'pointercancel') {
          position = 0;
          track = [];
        } else {
          release();
        }
      };
      handleElement.addEventListener('pointermove', move);
      handleElement.addEventListener('pointerup', end);
      handleElement.addEventListener('pointercancel', end);
    }

    function onKeydown(event: KeyboardEvent) {
      if (!interactive()) return;
      const step = KEY_STEP / Math.max(travel(), 1);
      const isRtl = !!trackElement && getComputedStyle(trackElement).direction === 'rtl';
      const forward = isRtl ? 'ArrowLeft' : 'ArrowRight';
      const backward = isRtl ? 'ArrowRight' : 'ArrowLeft';
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        release();
        return;
      }
      const next =
        event.key === forward
          ? clamp01(position + step)
          : event.key === backward
            ? clamp01(position - step)
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? 1
                : null;
      if (next === null) return;
      event.preventDefault();
      position = next;
      record();
    }

    // 换了新图、或父级设回 idle（重试）：滑块回到起点；没对准时滑块晃一下
    watch(
      () => challenge?.id,
      () => {
        position = 0;
        track = [];
      },
    );
    watch(
      () => status,
      (next, previous) => {
        if (next === 'idle' && previous !== 'idle') {
          position = 0;
          track = [];
        }
        if (
          next === 'error' &&
          handleElement &&
          !matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
          handleElement.animate(
            [
              { translate: '0' },
              { translate: '-6px' },
              { translate: '6px' },
              { translate: '-4px' },
              { translate: '4px' },
              { translate: '0' },
            ],
            { duration: 360 },
          );
        }
      },
    );

    return () => {
      const locked = !interactive();
      const settling = !dragging;
      const text =
        status === 'verifying'
          ? messages.slideVerifying
          : status === 'success'
            ? messages.slideSuccess
            : status === 'error'
              ? (errorText ?? messages.slideError)
              : (hint ?? messages.slideHint);
      const icon = status === 'success' ? Check : status === 'error' ? X : ChevronsRight;
      const piecePercent = challenge ? ((position * travel()) / challenge.width) * 100 : 0;
      const pieceWidthPercent = challenge ? (challenge.pieceWidth / challenge.width) * 100 : 0;
      const aspect = challenge ? challenge.width / challenge.height : 2;
      return (
        <div
          {...mergeAttrs<'div'>({ sx: slideCaptchaStyles.root }, rest)}
          aria-busy={status === 'verifying' || undefined}
        >
          <div
            {...mergeAttrs<'div'>({
              sx: [slideCaptchaStyles.picture, slideCaptchaDynamicStyles.ratio(aspect)],
            })}
          >
            {challenge ? (
              <>
                <img
                  {...mergeAttrs<'img'>({ sx: slideCaptchaStyles.image })}
                  src={challenge.background}
                  alt=""
                  draggable={false}
                />
                <img
                  {...mergeAttrs<'img'>({
                    sx: [
                      slideCaptchaStyles.piece,
                      slideCaptchaDynamicStyles.pieceWidth(pieceWidthPercent),
                      slideCaptchaDynamicStyles.at(piecePercent),
                      settling && slideCaptchaStyles.pieceSettle,
                    ],
                  })}
                  src={challenge.piece}
                  alt=""
                  draggable={false}
                />
              </>
            ) : (
              <div {...mergeAttrs<'div'>({ sx: slideCaptchaStyles.loading })}>
                <Spinner />
                {messages.slideLoading}
              </div>
            )}
            <IconButton
              sx={slideCaptchaStyles.refresh}
              icon={RefreshCw}
              size="sm"
              variant="ghost"
              tone="neutral"
              aria-label={messages.slideRefresh}
              disabled={status === 'verifying'}
              onClick={() => onRefresh?.()}
            />
            {(status === 'success' || status === 'error') && (
              <div
                {...mergeAttrs<'div'>({
                  sx: [
                    slideCaptchaStyles.banner,
                    status === 'success'
                      ? slideCaptchaStyles.bannerSuccess
                      : slideCaptchaStyles.bannerError,
                  ],
                })}
              >
                {text}
              </div>
            )}
          </div>
          <div
            {...mergeAttrs<'div'>({ sx: slideCaptchaStyles.track }, undefined, {
              ref: _toRef(trackElement),
            })}
          >
            <div
              {...mergeAttrs<'div'>({
                sx: [
                  slideCaptchaStyles.fill,
                  status === 'success' && slideCaptchaStyles.fillSuccess,
                  status === 'error' && slideCaptchaStyles.fillError,
                  settling && slideCaptchaStyles.settle,
                  slideCaptchaDynamicStyles.fillTo(position),
                ],
              })}
            />
            <span {...mergeAttrs<'span'>({ sx: slideCaptchaStyles.hint })} aria-hidden="true">
              {position === 0 || status !== 'idle' ? text : null}
            </span>
            <div
              {...mergeAttrs<'div'>(
                {
                  sx: [
                    slideCaptchaStyles.handle,
                    dragging && slideCaptchaStyles.handleActive,
                    status === 'success' && slideCaptchaStyles.handleSuccess,
                    status === 'error' && slideCaptchaStyles.handleError,
                    locked && slideCaptchaStyles.locked,
                    settling && slideCaptchaStyles.settle,
                    slideCaptchaDynamicStyles.handleAt(position),
                  ],
                },
                undefined,
                { ref: _toRef(handleElement) },
              )}
              role="slider"
              aria-label={messages.slideLabel}
              aria-valuemin={0}
              aria-valuemax={travel()}
              aria-valuenow={pixels()}
              aria-valuetext={messages.slidePosition(pixels())}
              aria-disabled={locked || undefined}
              tabindex={locked ? -1 : 0}
              onPointerdown={grab}
              onKeydown={onKeydown}
            >
              <Icon icon={icon} />
            </div>
          </div>
          <VisuallyHidden aria-live="polite">{status === 'idle' ? '' : text}</VisuallyHidden>
        </div>
      );
    };
  },
);
