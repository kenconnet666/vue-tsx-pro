/**
 * 子路径 `@zerodep-dev/vue-tsx-pro-ui/testing`：在使用方自己的测试里驱动组件库的复合控件（Select、Cascader、TreeSelect、
 * 日期、Tree、DataTable），按用户的操作写测试，不依赖组件的内部结构。happy-dom、jsdom 与浏览器里都能用。
 *
 *   import { getControl, selectHarness, setupTestingDom } from '@zerodep-dev/vue-tsx-pro-ui/testing';
 */
export {
  cascaderHarness,
  dataTableHarness,
  dateFieldHarness,
  datePickerHarness,
  selectHarness,
  treeHarness,
  treeSelectHarness,
} from './controls';
export {
  accessibleName,
  click,
  getControl,
  itemText,
  press,
  settle,
  setupTestingDom,
  typeText,
  type TestingDomOptions,
} from './dom';
