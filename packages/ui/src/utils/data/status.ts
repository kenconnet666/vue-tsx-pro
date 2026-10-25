/**
 * 状态映射：一处写好每种状态的名字、色调、图标与说明，标记（StatusBadge）、表格的状态列、筛选的选项、步骤、看板的列共用，
 * 同一种状态在哪儿都是同一个颜色、同一个叫法。定义的顺序就是阶段的顺序（任务从“待启动”走到“关闭”）。
 *
 *   export const taskStatuses = createStatusMap({
 *     pending: { label: '待启动', tone: 'neutral' },
 *     designing: { label: '设计中', tone: 'info' },
 *     closed: { label: '关闭', tone: 'success' },
 *   });
 *   <StatusBadge statuses={taskStatuses} value={task.status} />
 *   <Select items={taskStatuses.options()} … />
 */
import type { IconData } from '../../base/Icon';
import type { ListboxOption } from '../../input/list-state';
import type { StatusTone } from '../style/tone-styles';

/** 一种状态的外观与文案 */
export interface StatusDefinition {
  /** 显示的名字 */
  label: string;
  /** 色调 */
  tone: StatusTone;
  /** 名字前的图标；不写时 StatusBadge 画一个同色的圆点 */
  icon?: IconData;
  /** 说明：筛选项、提示里显示（“验证不达标时退回方案设计”） */
  description?: string;
}

/** createStatusMap 的结果 */
export interface StatusMap<K extends string = string> {
  /** 全部状态的 key，按定义的顺序（阶段顺序） */
  readonly keys: readonly K[];
  /** 一种状态的定义；不认识的 key（接口多给了新状态）当成中性色、名字就是 key，不报错 */
  get(key: K | (string & {})): StatusDefinition;
  /** 名字 */
  label(key: K | (string & {})): string;
  /** 色调 */
  tone(key: K | (string & {})): StatusTone;
  /** 在阶段里的位置（从 0 起）；不认识的 key 是 -1 */
  order(key: K | (string & {})): number;
  /** 给 Select、Listbox、筛选用的选项：value 是 key，带名字与说明；只要一部分时传 keys */
  options(keys?: readonly K[]): ListboxOption[];
}

/** 定义一组状态：名字、色调、图标、说明，按阶段顺序写 */
export function createStatusMap<const K extends string>(
  definitions: Readonly<Record<K, StatusDefinition>>,
): StatusMap<K> {
  const keys = Object.keys(definitions) as K[];
  const index = new Map<string, number>(keys.map((key, position) => [key, position]));
  const get = (key: string): StatusDefinition =>
    index.has(key) ? definitions[key as K] : { label: key, tone: 'neutral' };
  return {
    keys,
    get,
    label: (key) => get(key).label,
    tone: (key) => get(key).tone,
    order: (key) => index.get(key) ?? -1,
    options: (subset = keys) =>
      subset.map((key) => ({
        value: key,
        label: definitions[key].label,
        description: definitions[key].description,
        icon: definitions[key].icon,
      })),
  };
}
