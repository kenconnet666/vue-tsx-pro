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
 * - 卡片：封面（可选的插图）、标题（dialog 的名称）、内容（描述）、步数、上一步 / 下一步（最后一步是“完成”）、跳过；
 * - 键盘：→ / ← 下一步 / 上一步（从右到左排版时反过来；焦点在输入框里时不处理），Esc 关闭；
 * - open、current 可受控；点“完成”时调用 onFinish，跳过或 Esc 时只关闭。
 *
 * 部件：Root（dialog，整屏透明）、Spotlight（镂空）、Panel（卡片）、Cover（封面）、Title、Content、Footer、
 * Progress（步数）、Skip（跳过）、Previous（上一步）、Next（下一步 / 完成）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { autoUpdate } from '@floating-ui/dom';
import { nextTick, onBeforeUnmount, useId, type VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { H2, type HeadingProps } from '../base/Heading';
import { Text, type TextProps } from '../base/Text';
import { useLang } from '../config/context';
import { Flex, type FlexProps } from '../layout/Flex';
import { clamp } from '../utils/data/number';
import { isRtl } from '../utils/dom/direction';
import { isEditable } from '../utils/dom/hotkeys';
import { anchorFloating, floatingStyles, type FloatingPlacement } from '../utils/dom/floating';
import {
  openSetter,
  type OpenChangeDetails,
  type OpenChangeProps,
  type OpenChangeReasons,
} from '../utils/dom/open-change';
import { openModalDialog } from '../utils/dom/overlay';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { t } from '../config/theme/tokens';

/** 引导的一步 */
export interface TourStep {
  /** 高亮的目标：选择器、元素或返回元素的函数；不写（或找不到）时卡片居中 */
  target?: string | HTMLElement | (() => HTMLElement | null | undefined);
  /** 标题 */
  title: VNodeChild;
  /** 说明 */
  content?: VNodeChild;
  /** 标题上方的封面：插图、截图、短视频 */
  cover?: VNodeChild;
  /** 卡片在目标的哪一侧，默认 bottom；空间不够时翻转 */
  placement?: FloatingPlacement;
}

/** 打开、无障碍关联由组件管理；未声明的属性落到 dialog 上 */
export interface TourProps
  extends PartProps<'dialog', 'open' | 'aria-labelledby' | 'aria-describedby'>, OpenChangeProps {
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
  /** 封面的部件属性 */
  propsCover?: PartProps<'div'>;
  /** 标题（dialog 的名称）的部件属性 */
  propsTitle?: Omit<Partial<HeadingProps>, 'id'>;
  /** 说明（dialog 的描述）的部件属性 */
  propsContent?: PartProps<'div', 'id'>;
  /** 底部一行（步数与按钮）的部件属性 */
  propsFooter?: Partial<FlexProps>;
  /** 步数（第几步 / 共几步）的部件属性 */
  propsProgress?: Partial<TextProps>;
  /** 跳过按钮的部件属性；点击由组件管理 */
  propsSkip?: Omit<Partial<ButtonProps>, 'onClick'>;
  /** 上一步按钮的部件属性；点击由组件管理 */
  propsPrevious?: Omit<Partial<ButtonProps>, 'onClick'>;
  /** 下一步（最后一步是完成）按钮的部件属性；点击由组件管理，可以设 disabled（完成某个操作后才能继续） */
  propsNext?: Omit<Partial<ButtonProps>, 'onClick'>;
}

/** Tour 的样式：root、spotlight、dimmed、panel、cover、title、content、footer、progress */
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
    boxShadow: `0 0 0 100vmax ${t.colors.overlay}`,
    pointerEvents: 'none',
    transition: `left ${t.durations.md} ${t.easings.standard}, top ${t.durations.md} ${t.easings.standard}, width ${t.durations.md} ${t.easings.standard}, height ${t.durations.md} ${t.easings.standard}`,
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
  // 封面贴着卡片的上、左、右边（盖住内边距），圆角随卡片
  cover: {
    display: 'grid',
    overflow: 'hidden',
    marginBlockStart: `calc(-1 * ${t.space.lg})`,
    marginInline: `calc(-1 * ${t.space.lg})`,
    marginBlockEnd: '_xs',
    borderStartStartRadius: 'inherit',
    borderStartEndRadius: 'inherit',
  },
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
    onOpenChange,
    current = _bindable(0),
    padding = 6,
    onFinish,
    propsSpotlight,
    propsPanel,
    propsCover,
    propsTitle,
    propsContent,
    propsFooter,
    propsProgress,
    propsSkip,
    propsPrevious,
    propsNext,
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
    const setOpen = openSetter(
      () => open,
      (next) => (open = next),
      () => onOpenChange,
    );
    // 这次关闭的原因：跳过是 close、完成是 confirm，没记下的是 Esc
    let closing: OpenChangeDetails | undefined;

    const step = () => steps[clamp(current, 0, steps.length - 1)];
    const last = () => current >= steps.length - 1;

    // 与对话框同一套模态行为（含锁定页面滚动：引导期间页面不跟着滚，目标由引导自己滚进视口）
    function show() {
      if (!dialog || dialog.open) return;
      release = openModalDialog(dialog);
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

    function close(reason: keyof OpenChangeReasons, event?: Event) {
      closing = { reason, event };
      dialog?.close();
    }

    // 不论以什么方式关闭（Esc、跳过、完成、open 改为 false），都会触发原生 close 事件
    function onClose() {
      stopFollow?.();
      stopFollow = undefined;
      release?.();
      release = undefined;
      const { reason, event } = closing ?? { reason: 'escape' };
      closing = undefined;
      setOpen(false, reason, event);
    }

    function next(event?: Event) {
      if (!last()) {
        current++;
        return;
      }
      close('confirm', event);
      onFinish?.();
    }

    /** → / ← 切换步骤（从右到左排版时反过来）；焦点在可编辑的元素里时留给它，下一步按钮不可用时不前进 */
    function onKeydown(event: KeyboardEvent) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isEditable(event.target)) return;
      const forward = (event.key === 'ArrowRight') !== (panel !== null && isRtl(panel));
      if (forward && !propsNext?.disabled) next(event);
      else if (!forward && current > 0) current--;
      else return;
      event.preventDefault();
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
            onKeydown,
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
              {currentStep.cover != null && (
                <div {...mergeAttrs<'div'>({ sx: tourStyles.cover }, propsCover)}>
                  {currentStep.cover}
                </div>
              )}
              <H2
                {...mergePartProps<HeadingProps>({ size: 'md', sx: tourStyles.title }, propsTitle, {
                  id: titleId,
                })}
              >
                {currentStep.title}
              </H2>
              {currentStep.content != null && (
                <div
                  {...mergeAttrs<'div'>({ sx: tourStyles.content }, propsContent, {
                    id: contentId,
                  })}
                >
                  {currentStep.content}
                </div>
              )}
              <Flex
                {...mergePartProps<FlexProps>(
                  { align: 'center', gap: 'sm', wrap: true, sx: tourStyles.footer },
                  propsFooter,
                )}
              >
                <Text
                  {...mergePartProps<TextProps>(
                    { size: 'sm', tone: 'muted', sx: tourStyles.progress },
                    propsProgress,
                  )}
                >
                  {lang.tourProgress(current + 1, steps.length)}
                </Text>
                {!last() && (
                  <Button
                    {...mergePartProps<ButtonProps>(
                      { variant: 'ghost', tone: 'neutral', size: 'sm' },
                      propsSkip,
                      { onClick: (event: MouseEvent) => close('close', event) },
                    )}
                  >
                    {lang.tourSkip}
                  </Button>
                )}
                {current > 0 && (
                  <Button
                    {...mergePartProps<ButtonProps>(
                      { variant: 'outline', size: 'sm' },
                      propsPrevious,
                      { onClick: () => current-- },
                    )}
                  >
                    {lang.tourPrevious}
                  </Button>
                )}
                <Button
                  {...mergePartProps<ButtonProps>({ size: 'sm' }, propsNext, { onClick: next })}
                >
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
