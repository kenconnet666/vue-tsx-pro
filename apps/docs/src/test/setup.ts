// happy-dom（21）没有 Popover API：挂载时就打开 popover 的组件（Toaster 的通知区域）会抛错。
// 这里的测试只看示例能不能渲染，补空实现即可；显示与层叠在真实浏览器的测试里验证。
// 构建脚本的测试（build/*.test.ts）跑在 node 环境，没有 DOM
if (typeof HTMLElement !== 'undefined' && !('showPopover' in HTMLElement.prototype)) {
  Object.assign(HTMLElement.prototype, {
    showPopover() {},
    hidePopover() {},
    togglePopover: () => false,
  });
}
