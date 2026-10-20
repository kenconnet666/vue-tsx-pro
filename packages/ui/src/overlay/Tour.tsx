/**
 * 新手引导（原生模态 dialog）：一步一步高亮页面上的元素并说明。遮罩盖住整页，目标处镂空；步骤卡片贴着目标显示。
 *
 *   <Tour
 *     open={_bind(touring)}
 *     current={_bind(step)}
 *     steps={[
 *       { target: '#search', title: '搜索', content: '按名称或编号查找订单' },
 *       { target: () => exportButton, title: '导出', content: '导出为 Excel', placement: 'left' },
 *       { title: '就这些', content: '随时可以在帮助菜单里重新查看' },   // 没有目标：卡片居中
 *     ]}
 *   />
 *
 * - 模态：背景 inert、Esc 关闭、焦点在卡片里循环，关闭后焦点回到打开前的位置（同 Dialog，见 Modal.tsx）；
 * - 目标：选择器、元素或返回元素的函数；切换步骤时滚动到视口中间，滚动、缩放、目标大小变化时镂空与卡片跟着动；
 *   找不到目标时卡片居中、整页遮罩；
 * - 卡片：标题（dialog 的名称）、内容（描述）、步数、上一步 / 下一步（最后一步是“完成”）、跳过；
 * - open、current 可受控；点“完成”时调用 onFinish，跳过或 Esc 时只关闭。
 *
 * 部件：Root（dialog，整屏透明）、Spotlight（镂空）、Panel（卡片）、Title、Content、Footer。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { autoUpdate } from '@floating-ui/dom';
import { nextTick, onBeforeUnmount, useId, type VNodeChild } from 'vue';
import { Button } from '../base/Button';
import { H2 } from '../base/Heading';
import { Text } from '../base/Text';
import { useLang } from '../config/context';
import { Flex } from '../layout/Flex';
import { clamp } from '../utils/data/number';
import { anchorFloating, floatingStyles, type FloatingPlacement } from '../utils/dom/floating';
import { focusOrigin, returnFocus, trapFocus } from '../utils/dom/focus';
import { trackModal } from '../utils/dom/overlay';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 引导的一步 */
export interface TourStep {
  /** 高亮的目标：选择器、元素或返回元素的函数；不写（或找不到）时卡片居中 */
  target?: string | HTMLElement | (() => HTMLElement | null | undefined);
  /** 标题 */
  title: VNodeChild;
  /** 说明 */
  content?: VNodeChild;
  /** 卡片在目标的哪一侧，默认 bottom；空间不够时翻转 */
  placement?: FloatingPlacement;
}

/** 打开、无障碍关联由组件管理；未声明的属性落到 dialog 上 */
export interface TourProps extends PartProps<
  'dialog',
  'open' | 'aria-labelledby' | 'aria-describedby'
> {
  /** 各步 */
  steps: readonly TourStep[];
  /** 是否显示：父级写 open={_bind(x)} */
  open?: boolean;
  /** 当前第几步，从 0 开始：父级写 current={_bind(n)} */
  current?: number;
  /** 镂空比目标大出多少（px），默认 6 */
  padding?: number;
  /** 点了最后一步的“完成” */
  onFinish?: () => void;
  /** 镂空的部件属性 */
  propsSpotlight?: PartProps<'div'>;
  /** 卡片的部件属性 */
  propsPanel?: PartProps<'div'>;
}

/** Tour 的样式：root、spotlight、dimmed、panel、title、content、footer、progress */
export const tourStyles = stylex.create({
  // 整屏透明的 dialog：遮罩由镂空的阴影画，原生 ::backdrop 不用
  root: {
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100%',
    maxWidth: 'none',
    maxHeight: 'none',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    '::backdrop': { backgroundColor: 'transparent' },
  },
  // 一个盒子画成镂空：外面一圈巨大的阴影就是遮罩
  spotlight: {
    position: 'fixed',
    borderRadius: '_md',
    boxShadow: '0 0 0 100vmax _colors.overlay',
    pointerEvents: 'none',
    transition:
      'left _durations.md _easings.standard, top _durations.md _easings.standard, width _durations.md _easings.standard, height _durations.md _easings.standard',
  },
  // 没有目标：整页遮罩
  dimmed: { inset: 0, borderRadius: 0, backgroundColor: '_overlay', boxShadow: 'none' },
  panel: {
    display: 'grid',
    gap: '_sm',
    width: 'min(22rem, calc(100vw - 2rem))',
    padding: '_lg',
    lineHeight: '_normal',
  },
  centered: { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' },
  title: { margin: 0 },
  content: { color: '_textMuted' },
  footer: { marginBlockStart: '_xs' },
  progress: { marginInlineEnd: 'auto' },
});

// 镂空的位置是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** Tour 的样式：rect（镂空的位置与大小） */
export const tourDynamicStyles = stylex.create({
  rect: (left: number, top: number, width: number, height: number) => ({
    left,
    top,
    width,
    height,
  }),
});

/** 读出这一步的目标元素 */
function resolveTarget(target: TourStep['target']): HTMLElement | null {
  if (!target) return null;
  if (typeof target === 'string') return document.querySelector<HTMLElement>(target);
  if (typeof target === 'function') return target() ?? null;
  return target;
}

/** 新手引导：遮罩镂空高亮目标，卡片说明，一步一步往下走 */
export const Tour = _component(
  ({
    steps,
    open = _bindable(false),
    current = _bindable(0),
    padding = 6,
    onFinish,
    propsSpotlight,
    propsPanel,
    ...rest
  }: TourProps) => {
    const lang = useLang();
    const id = useId();
    const titleId = `${id}-title`;
    const contentId = `${id}-content`;
    let dialog = _state.raw<HTMLDialogElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);
    // 镂空的位置；没有目标时为 null（整页遮罩、卡片居中）
    let rect = _state<{ left: number; top: number; width: number; height: number } | null>(null);
    let release: (() => void) | undefined;
    let stopFollow: (() => void) | undefined;

    const step = () => steps[clamp(current, 0, steps.length - 1)];
    const last = () => current >= steps.length - 1;

    function show() {
      if (!dialog || dialog.open) return;
      const opener = focusOrigin();
      dialog.showModal();
      const target = dialog;
      const cleanups = [trackModal(target), trapFocus(target)];
      release = () => {
        for (const cleanup of cleanups) cleanup();
        returnFocus(target, opener);
      };
    }

    /** 跟随这一步的目标：滚到视口中间，之后镂空与卡片随滚动、缩放、大小变化更新 */
    async function follow() {
      stopFollow?.();
      stopFollow = undefined;
      await nextTick();
      const target = resolveTarget(step()?.target);
      if (!panel) return;
      if (!target) {
        rect = null;
        // 上一步定位时写的内联位置清掉，卡片回到居中
        Object.assign(panel.style, { left: '', top: '', visibility: '', transformOrigin: '' });
        panel.focus({ preventScroll: true });
        return;
      }
      target.scrollIntoView({ block: 'center', inline: 'nearest' });
      const anchored = anchorFloating(target, panel, {
        placement: step()?.placement ?? 'bottom',
        offset: padding + 8,
        crossAxisFallback: true,
      });
      const stopSpotlight = autoUpdate(target, panel, () => {
        const box = target.getBoundingClientRect();
        rect = {
          left: box.left - padding,
          top: box.top - padding,
          width: box.width + padding * 2,
          height: box.height + padding * 2,
        };
      });
      stopFollow = () => {
        anchored.stop();
        stopSpotlight();
      };
      await anchored.ready;
      panel.focus({ preventScroll: true });
    }

    function close() {
      dialog?.close();
    }

    // 不论以什么方式关闭（Esc、跳过、完成、open 改为 false），都会触发原生 close 事件
    function onClose() {
      stopFollow?.();
      stopFollow = undefined;
      release?.();
      release = undefined;
      open = false;
    }

    function next() {
      if (!last()) {
        current++;
        return;
      }
      close();
      onFinish?.();
    }

    _effect(() => {
      if (open) show();
      else if (dialog?.open) dialog.close();
    });
    // 打开、换步骤时重新跟随目标
    _effect(() => {
      void current;
      if (open) void follow();
    });
    onBeforeUnmount(() => {
      stopFollow?.();
      release?.();
    });

    return () => {
      const currentStep = step();
      return (
        <dialog
          {...mergeAttrs<'dialog'>({ sx: tourStyles.root }, rest, {
            ref: _toRef(dialog),
            'aria-labelledby': titleId,
            'aria-describedby': currentStep?.content != null ? contentId : undefined,
            onClose,
          })}
          data-step={current}
        >
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [
                  tourStyles.spotlight,
                  rect
                    ? tourDynamicStyles.rect(rect.left, rect.top, rect.width, rect.height)
                    : tourStyles.dimmed,
                ],
              },
              propsSpotlight,
              { 'aria-hidden': true },
            )}
          />
          {currentStep && (
            <div
              {...mergeAttrs<'div'>(
                {
                  sx: [
                    floatingStyles.anchored,
                    floatingStyles.surface,
                    tourStyles.panel,
                    !rect && tourStyles.centered,
                  ],
                },
                propsPanel,
                { ref: _toRef(panel), tabindex: -1 },
              )}
            >
              <H2 size="md" id={titleId} sx={tourStyles.title}>
                {currentStep.title}
              </H2>
              {currentStep.content != null && (
                <div id={contentId} {...stylex.attrs(tourStyles.content)}>
                  {currentStep.content}
                </div>
              )}
              <Flex align="center" gap="sm" wrap sx={tourStyles.footer}>
                <Text size="sm" tone="muted" sx={tourStyles.progress}>
                  {lang.tourProgress(current + 1, steps.length)}
                </Text>
                {!last() && (
                  <Button variant="ghost" tone="neutral" size="sm" onClick={close}>
                    {lang.tourSkip}
                  </Button>
                )}
                {current > 0 && (
                  <Button variant="outline" size="sm" onClick={() => current--}>
                    {lang.tourPrevious}
                  </Button>
                )}
                <Button size="sm" onClick={next}>
                  {last() ? lang.tourFinish : lang.tourNext}
                </Button>
              </Flex>
            </div>
          )}
        </dialog>
      );
    };
  },
  { name: 'Tour' },
);
