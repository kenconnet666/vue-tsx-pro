/**
 * 画布的缩放按钮：缩小、当前比例（点击回到原大）、放大、适应画布。放在 Diagram 的 overlay 里，从 DiagramContext 拿控制器：
 *
 *   <Diagram overlay={<DiagramControls />} … />
 *
 * 一组按钮是一个工具栏（Toolbar）：整组占一个 Tab 位置，组内用方向键移动。到了缩放上限、下限时对应的按钮不可用。
 * 部件：Root（Toolbar）、Button（每个图标按钮）、Level（比例按钮）。
 */
import { Scan, ZoomIn, ZoomOut } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Button, type ButtonProps } from '../base/Button';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useMessages } from '../config/lang/messages';
import { Toolbar, type ToolbarProps } from '../navigation/Toolbar';
import { mergePartProps } from '../utils/props';
import { DiagramContext } from './Diagram';
import { diagramMessages } from './messages';

/** 缩放按钮放在画布的哪个角 */
export interface DiagramControlsPlacements {
  /** 左下（从右到左时右下），默认 */
  'bottom-start': unknown;
  /** 右下 */
  'bottom-end': unknown;
  /** 左上 */
  'top-start': unknown;
  /** 右上 */
  'top-end': unknown;
}

/** 未声明的属性落到工具栏（Toolbar）上 */
export interface DiagramControlsProps extends Partial<ToolbarProps> {
  /** 放在画布的哪个角，默认 bottom-start */
  placement?: keyof DiagramControlsPlacements;
  /** 每个图标按钮的部件属性 */
  propsButton?: Partial<IconButtonProps>;
  /** 比例按钮的部件属性 */
  propsLevel?: Partial<ButtonProps>;
}

/** DiagramControls 的样式 */
export const diagramControlsStyles = css.create({
  root: {
    position: 'absolute',
    pointerEvents: 'auto',
    gap: '2px',
    padding: '2px',
    backgroundColor: '_surface',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    boxShadow: '_sm',
  },
  'bottom-start': { insetBlockEnd: '_space.sm', insetInlineStart: '_space.sm' },
  'bottom-end': { insetBlockEnd: '_space.sm', insetInlineEnd: '_space.sm' },
  'top-start': { insetBlockStart: '_space.sm', insetInlineStart: '_space.sm' },
  'top-end': { insetBlockStart: '_space.sm', insetInlineEnd: '_space.sm' },
  // 比例的数字等宽，缩放时按钮不跟着变宽
  level: { minWidth: '3.5em', fontVariantNumeric: 'tabular-nums' },
});

/** 画布的缩放按钮 */
export const DiagramControls = _component(
  ({ placement = 'bottom-start', propsButton, propsLevel, ...rest }: DiagramControlsProps) => {
    const diagram = DiagramContext.inject();
    const messages = useMessages('diagram', diagramMessages);
    const button = (props: IconButtonProps) =>
      mergePartProps<IconButtonProps>({ variant: 'ghost', size: 'sm', ...props }, propsButton);
    return () => {
      const percent = Math.round(diagram.scale * 100);
      return (
        <Toolbar
          {...mergePartProps<ToolbarProps>(
            {
              'aria-label': messages.controls,
              sx: [diagramControlsStyles.root, diagramControlsStyles[placement]],
            },
            rest,
          )}
        >
          <IconButton
            {...button({
              icon: ZoomOut,
              'aria-label': messages.zoomOut,
              disabled: !diagram.canZoomOut,
              onClick: () => diagram.zoomOut(),
            })}
          />
          <Button
            {...mergePartProps<ButtonProps>(
              {
                variant: 'ghost',
                size: 'sm',
                sx: diagramControlsStyles.level,
                'aria-label': messages.zoomLevel(percent),
                onClick: () => diagram.zoomTo(1),
              },
              propsLevel,
            )}
          >
            {percent}%
          </Button>
          <IconButton
            {...button({
              icon: ZoomIn,
              'aria-label': messages.zoomIn,
              disabled: !diagram.canZoomIn,
              onClick: () => diagram.zoomIn(),
            })}
          />
          <IconButton
            {...button({ icon: Scan, 'aria-label': messages.fit, onClick: () => diagram.fit() })}
          />
        </Toolbar>
      );
    };
  },
);
