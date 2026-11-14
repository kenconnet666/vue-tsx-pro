/**
 * 时刻按哪个时区显示、换算（在 setup 里调用，返回读取函数）：
 *
 *   const zone = useTimeZone();
 *   toInstant(value, zone())          // 渲染函数、回调里读：语言换了、水合完了都跟着变
 *
 * - 语言配置了 timeZone：就用它，服务端与浏览器一致。
 * - 没配置：浏览器里是浏览器的时区。服务端没有“用户的时区”，固定按 UTC 渲染（不取服务器所在的时区：构建机、
 *   各台服务器渲染出来的一致）；水合时先按 UTC（和服务端渲染的节点一致），挂载后换成浏览器的时区，文字、
 *   悬停提示都跟着改过来。原来服务端按自己的时区渲染、浏览器直接按浏览器的时区水合，节点对不上，而属性的不一致
 *   Vue 不会改回来：相对时间的悬停提示一直是服务器时区的时间。
 */
import { getLocalTimeZone } from '@internationalized/date';
import { isHydrating, isServerRendering, useMounted } from '../../utils/dom/mounted';
import { useLang } from '../context';

/** 没配置时区时服务端渲染用的时区 */
const SERVER_TIME_ZONE = 'UTC';

/** 当前的时区（见文件开头） */
export function useTimeZone(): () => string {
  const lang = useLang();
  if (isServerRendering()) return () => lang.timeZone ?? SERVER_TIME_ZONE;
  if (!isHydrating()) return () => lang.timeZone ?? getLocalTimeZone();
  const mounted = useMounted();
  return () => lang.timeZone ?? (mounted.value ? getLocalTimeZone() : SERVER_TIME_ZONE);
}
