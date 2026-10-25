/**
 * 画布（Diagram、DiagramControls）自带的文案：中文与英文各一份，
 * 可以在 createUi 的 lang.messages.diagram 里按字段改写（见 config/lang/messages.ts）
 */
import type { MessageTable } from '../config/lang/messages';

/** 画布的文案 */
export interface DiagramMessages {
  /** 画布的角色说明（aria-roledescription） */
  readonly canvas: string;
  /** 节点的角色说明 */
  readonly node: string;
  /** 连线的角色说明 */
  readonly edge: string;
  /** 连线的默认名称：`从 提交申请 到 部门审批` */
  readonly edgeBetween: (from: string, to: string) => string;
  /** 缩放工具栏的名称 */
  readonly controls: string;
  /** 放大 */
  readonly zoomIn: string;
  /** 缩小 */
  readonly zoomOut: string;
  /** 适应画布 */
  readonly fit: string;
  /** 当前缩放（百分数），点击回到原大 */
  readonly zoomLevel: (percent: number) => string;
}

/** 画布的内置文案 */
export const diagramMessages: MessageTable<DiagramMessages> = {
  'zh-CN': {
    canvas: '画布',
    node: '节点',
    edge: '连线',
    edgeBetween: (from, to) => `从 ${from} 到 ${to}`,
    controls: '缩放',
    zoomIn: '放大',
    zoomOut: '缩小',
    fit: '适应画布',
    zoomLevel: (percent) => `缩放 ${percent}%，点击回到原大`,
  },
  'en-US': {
    canvas: 'Canvas',
    node: 'Node',
    edge: 'Connection',
    edgeBetween: (from, to) => `From ${from} to ${to}`,
    controls: 'Zoom',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fit: 'Fit to view',
    zoomLevel: (percent) => `Zoom ${percent}%, click to reset to 100%`,
  },
};
