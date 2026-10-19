/**
 * 加载遮罩（div）：盖住一块区域（卡片、表单、图表），内容保留在下面，中间显示加载指示。
 *
 *   <LoadingOverlay loading={saving}>
 *     <Form controller={form}>…</Form>
 *   </LoadingOverlay>
 *
 * 外层带 aria-busy；遮罩防闪烁（useDelayedLoading：很快完成时不出现，出现后至少显示一会儿），淡入淡出（usePresence）。
 * 遮罩挡住指针操作；键盘仍可操作下面的内容，需要禁止时由内容自己处理（如表单的 disabled）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { Spinner, type SpinnerProps } from '../base/Spinner';
import { useLang } from '../config/context';
import { useDelayedLoading } from '../utils/motion/delayed-loading';
import { usePresence } from '../utils/motion/presence';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import type { StyleTable } from '../utils/style/styles';

/** 忙碌由组件按 loading 管理 */
export type LoadingOverlayManaged = 'aria-busy';

/** 未声明的属性落到外层 div 上 */
export interface LoadingOverlayProps extends PartProps<'div', LoadingOverlayManaged> {
  /** 加载中：盖上遮罩 */
  loading?: boolean;
  /** 读屏念的说明，默认取语言包（加载中） */
  label?: string;
  /** 遮罩下的内容模糊 */
  blur?: boolean;
  /** 遮罩的部件属性 */
  propsOverlay?: PartProps<'div'>;
  /** 加载指示的部件属性 */
  propsSpinner?: Partial<SpinnerProps>;
  children?: VNodeChild;
}

/** LoadingOverlay 的样式：root、overlay、blur、closing、spinner */
export const loadingOverlayStyles: StyleTable<'root' | 'overlay' | 'blur' | 'closing' | 'spinner'> =
  stylex.create({
    // 遮罩按外层定位
    root: { position: 'relative' },
    overlay: {
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      display: 'grid',
      placeItems: 'center',
      borderRadius: 'inherit',
      backgroundColor: 'color-mix(in srgb, _surface 70%, transparent)',
      opacity: { default: 1, '@starting-style': 0 },
      transition: 'opacity _durations.md _easings.enter',
    },
    blur: { backdropFilter: 'blur(2px)' },
    closing: { opacity: 0, transition: 'opacity _durations.sm _easings.exit' },
    spinner: { fontSize: '_xl', color: '_accent' },
  });

/** 加载遮罩：盖住内容，显示加载指示 */
export const LoadingOverlay = _component(
  ({
    loading = false,
    label,
    blur = false,
    propsOverlay,
    propsSpinner,
    children,
    ...rest
  }: LoadingOverlayProps) => {
    const lang = useLang();
    const shown = useDelayedLoading(() => loading);
    const presence = usePresence(() => shown.value);

    return () => (
      <div
        {...elementProps(
          mergeProps<'div'>({ sx: loadingOverlayStyles.root }, rest, {
            'aria-busy': loading || undefined,
          }),
        )}
      >
        {children}
        {presence.mounted && (
          <div
            {...elementProps(
              mergeProps<'div'>(
                {
                  sx: [
                    loadingOverlayStyles.overlay,
                    blur && loadingOverlayStyles.blur,
                    presence.state === 'closed' && loadingOverlayStyles.closing,
                  ],
                },
                propsOverlay,
                { ref: presence.ref },
              ),
            )}
            data-state={presence.state}
          >
            <Spinner
              {...mergePartProps<SpinnerProps>(
                { sx: loadingOverlayStyles.spinner, label: label ?? lang.loading },
                propsSpinner,
              )}
            />
          </div>
        )}
      </div>
    );
  },
);
