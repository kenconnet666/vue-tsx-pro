/**
 * 单容器图表（环形图、桑基图、弦图）共用的绘制过程：Unovis 的 SingleContainer 只建一次，数据与配置变化时 update，
 * 卸载时 destroy；绘图区换了元素（加载、空状态之后重新出现）时容器连同组件、提示框一起重建。
 * 提示框按选择器触发，内容用 Vue 渲染进同一个元素交给 Unovis 定位。在组件 setup 里调用。
 *
 *   const chart = useSingleChart(() => ({
 *     element: plot, ready: !loading && rows.length > 0, tooltip,
 *     build: (instance) => ({ component: …, data: rows, triggers: { [Donut.selectors.segment]: (d) => chart.tooltip(…) } }),
 *   }));
 */
import { SingleContainer, Tooltip, type ComponentCore } from '@unovis/ts';
import { render, useId, type VNode } from 'vue';
import { chartDuration, createChartInstances, uniqueHighlightFilter } from './frame';

/** 一次绘制要的东西 */
export interface SingleChartBuild<D> {
  /** 配置好的组件 */
  component: ComponentCore<D>;
  /** 交给组件的数据 */
  data: D;
  /** 提示框：选择器 → 悬停的数据 → 内容（Unovis 的 Tooltip triggers） */
  triggers?: NonNullable<Tooltip['config']['triggers']>;
}

/** useSingleChart 每次读取的状态 */
export interface SingleChartState<D> {
  /** 绘图区元素 */
  element: HTMLElement | null;
  /** 可以画了：不在加载中、有数据 */
  ready: boolean;
  /** 显示提示框 */
  tooltip: boolean;
  /** 配置组件：instance 取跨渲染保留的实例（第一次调用时创建） */
  build: (instance: <C>(key: string, create: () => C) => C) => SingleChartBuild<D>;
}

/** useSingleChart 的返回值 */
export interface SingleChart {
  /** 提示框的内容渲染进同一个元素，交给 Unovis 定位 */
  tooltip(content: VNode): HTMLElement;
}

/** 单容器图表的绘制 */
export function useSingleChart<D>(read: () => SingleChartState<D>): SingleChart {
  const id = useId();
  const instances = createChartInstances();
  let tooltipElement: HTMLElement | undefined;
  let container: SingleContainer<D> | undefined;
  let containerElement: HTMLElement | undefined;

  _effect(() => () => {
    container?.destroy();
    if (tooltipElement) render(null, tooltipElement);
  });
  _effect(() => {
    const { element, ready, tooltip, build } = read();
    if (!element || !ready) return;
    // 绘图区换了元素：旧容器连同组件、提示框一起销毁，实例表清空后重新创建
    if (container && containerElement !== element) {
      container.destroy();
      container = undefined;
      instances.reset();
    }
    const { component, data, triggers } = build(instances.get);
    const tooltipBox = instances.get('tooltip', () => new Tooltip());
    tooltipBox.setConfig({ triggers: triggers ?? {} });
    const config = {
      component,
      tooltip: tooltip ? tooltipBox : undefined,
      ariaLabel: null,
      duration: chartDuration(element),
    };
    if (container) container.update(config, undefined, data);
    else {
      container = new SingleContainer<D>(element, config, data);
      containerElement = element;
      uniqueHighlightFilter(element, `${id}-highlight`);
    }
  });

  return {
    tooltip(content) {
      tooltipElement ??= document.createElement('div');
      render(content, tooltipElement);
      return tooltipElement;
    },
  };
}
