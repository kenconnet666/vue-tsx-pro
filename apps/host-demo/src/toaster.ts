// 应用级的通知控制器：组件内外都从这里导入，显示区域 <Toaster controller={toaster} /> 放在页面里
import { createToaster } from '@zerodep-dev/vue-tsx-pro-ui';

/** 演示页共用的通知控制器 */
export const toaster = createToaster();
